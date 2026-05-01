// test_user_mgmt.js — 自动验证用户管理模块功能
import fetch from 'node-fetch';

const BASE = 'http://localhost:3000/api';
let token = '';
let results = { pass: 0, fail: 0, details: [] };

const log = (label, pass, details = '') => {
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${label}${details ? ': ' + details : ''}`);
  results[pass ? 'pass' : 'fail']++;
  results.details.push({ label, pass, details });
};

const req = async (method, path, body, customToken) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customToken || token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
};

console.log('\n🔍 开始验证用户管理模块功能...\n');

// 1. 登录获取 token
try {
  const { status, data } = await req('POST', '/auth/login', { username: 'admin001', password: 'any_password' });
  token = data.token;
  log('管理员登录获取 Token', status === 200 && !!token, token ? '获取成功' : '获取失败');
} catch (e) {
  log('管理员登录', false, e.message);
  console.log('\n❗ 无法连接后端服务 (http://localhost:3000)，请先启动后端服务后再运行此测试。');
  process.exit(1);
}

// 2. 获取用户列表
try {
  const { status, data } = await req('GET', '/admin/users?page=1&pageSize=10');
  log('获取用户列表 API', status === 200 && data.success, `总计 ${data.total ?? '?'} 个用户`);
} catch (e) {
  log('获取用户列表 API', false, e.message);
}

// 3. 获取学院列表
try {
  const { status, data } = await req('GET', '/admin/colleges');
  log('获取学院列表', status === 200 && data.success, `共 ${data.colleges?.length ?? 0} 个学院`);
} catch (e) {
  log('获取学院列表', false, e.message);
}

// 4. 创建测试用户
const testUserId = `test_mgmt_${Date.now()}`;
let userCreated = false;
try {
  const { status, data } = await req('POST', '/admin/users', {
    id: testUserId,
    name: '测试用户-自动化',
    student_no: testUserId,
    gender: '男',
    college: '软件工程学院',
    major: '软件技术',
    class_name: '软件技术24级测试班',
    enroll_year: '2024',
    phone: '13800000099',
    email: 'test@example.com',
    password: 'test123456'
  });
  userCreated = status === 200 && data.success;
  log('创建单个用户', userCreated, data.message || data.error);
} catch (e) {
  log('创建单个用户', false, e.message);
}

// 5. 获取刚创建用户详情
if (userCreated) {
  try {
    const { status, data } = await req('GET', `/admin/users/${testUserId}`);
    log('获取用户详情', status === 200 && data.success && data.user?.id === testUserId, `姓名: ${data.user?.name}`);
  } catch (e) {
    log('获取用户详情', false, e.message);
  }

  // 6. 编辑用户信息
  try {
    const { status, data } = await req('PUT', `/admin/users/${testUserId}`, {
      phone: '13900000099',
      email: 'updated@example.com',
      address: '测试省测试市测试区'
    });
    log('编辑用户信息', status === 200 && data.success, data.message || data.error);
  } catch (e) {
    log('编辑用户信息', false, e.message);
  }

  // 7. 重置用户密码
  try {
    const { status, data } = await req('PUT', `/admin/users/${testUserId}/password`, {
      new_password: 'newpassword123'
    });
    log('重置用户密码', status === 200 && data.success, data.message || data.error);
  } catch (e) {
    log('重置用户密码', false, e.message);
  }
}

// 8. 批量导入用户
const importId1 = `import_test_A_${Date.now()}`;
const importId2 = `import_test_B_${Date.now()}`;
try {
  const { status, data } = await req('POST', '/admin/users/import', {
    users: [
      { id: importId1, name: '批量导入测试A', college: '软件工程学院', major: '软件技术', class_name: '测试班', enroll_year: '2024', password: '123456' },
      { id: importId2, name: '批量导入测试B', college: '计算机学院', major: '计算机应用', class_name: '计算机班', enroll_year: '2024', password: '123456' },
      { id: importId1, name: '重复ID应被拒绝', college: '测试' }  // 重复ID，应跳过
    ]
  });
  const isOk = status === 200 && data.success && data.results?.success === 2 && data.results?.failed === 1;
  log('批量导入用户 (含重复检验)', isOk, data.message || data.error);
} catch (e) {
  log('批量导入用户', false, e.message);
}

// 9. 搜索过滤用户
try {
  const { status, data } = await req('GET', '/admin/users?search=测试&college=软件工程学院');
  log('搜索过滤用户', status === 200 && data.success, `搜索结果 ${data.total ?? 0} 条`);
} catch (e) {
  log('搜索过滤用户', false, e.message);
}

// 10. 学生身份登录尝试访问 (应被拒绝)
try {
  const { status, data: studentAuth } = await req('POST', '/auth/login', { username: 'student001', password: 'any' });
  const studentToken = studentAuth.token;
  const { status: s2, data } = await req('GET', '/admin/users', null, studentToken);
  log('学生角色权限拦截', s2 === 403, `返回状态: ${s2}`);
} catch (e) {
  log('学生角色权限拦截', false, e.message);
}

// 11. 清理：删除测试用户
const toCleanup = [testUserId, importId1, importId2];
let cleanCount = 0;
for (const uid of toCleanup) {
  try {
    const { status, data } = await req('DELETE', `/admin/users/${uid}`);
    if (data.success) cleanCount++;
  } catch (e) {}
}
log('测试数据清理', cleanCount > 0, `删除 ${cleanCount} 条测试记录`);

// 输出汇总
console.log('\n' + '='.repeat(50));
console.log(`📊 测试汇总: 通过 ${results.pass} / 失败 ${results.fail} / 共 ${results.pass + results.fail} 项`);
if (results.fail === 0) {
  console.log('🎉 所有测试通过！用户管理模块功能正常。');
} else {
  console.log(`⚠️  有 ${results.fail} 项测试未通过，请检查对应功能。`);
}
console.log('='.repeat(50) + '\n');
process.exit(results.fail > 0 ? 1 : 0);
