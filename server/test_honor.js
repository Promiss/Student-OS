import axios from 'axios';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000/api';
let studentToken = '';
let adminToken = '';
let categoryId = '';
let applicationId = '';

async function runTests() {
  console.log('--- 荣誉展示模块 自动化测试开始 ---');

  try {
    // 1. 登录获取 Token
    console.log('[1/7] 登录测试账号...');
    const studentRes = await axios.post(`${BASE_URL}/auth/login`, { username: 'student_123', password: 'password' });
    studentToken = studentRes.data.token;
    assert.ok(studentToken, '学生登录失败');

    // Create student profile to avoid FK constraint error
    await axios.put(`${BASE_URL}/auth/profile`, { phone: '13800000000' }, { headers: { Authorization: `Bearer ${studentToken}` } });

    const adminRes = await axios.post(`${BASE_URL}/auth/login`, { username: 'super_admin', password: 'password' });
    adminToken = adminRes.data.token;
    assert.ok(adminToken, '管理员登录失败');
    console.log('✅ 登录成功');

    // 2. 管理员新增荣誉类型
    console.log('[2/7] 管理员新增荣誉类型...');
    const catRes = await axios.post(`${BASE_URL}/honor/categories`, {
      name: '测试自动化奖学金',
      level: '国家级',
      template_url: '/assets/test.png'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    categoryId = catRes.data.data.id;
    assert.ok(categoryId, '创建荣誉类型失败');
    console.log('✅ 新增荣誉类型成功，ID:', categoryId);

    // 3. 学生提交申请
    console.log('[3/7] 学生提交荣誉申请...');
    const appRes = await axios.post(`${BASE_URL}/honor/applications`, {
      category_id: categoryId,
      proof_urls: ['/uploads/test.jpg'],
      description: '自动化测试申请说明'
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    applicationId = appRes.data.data.id;
    assert.ok(applicationId, '提交申请失败');
    console.log('✅ 学生提交申请成功，ID:', applicationId);

    // 4. 管理员获取待办列表
    console.log('[4/7] 管理员获取待办列表...');
    const listRes = await axios.get(`${BASE_URL}/honor/applications`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const appItem = listRes.data.data.find(a => a.id === applicationId);
    assert.equal(appItem.status, 'pending', '申请状态非待办');
    console.log('✅ 成功获取待办列表');

    // 5. 异常测试：管理员驳回必须填写理由
    console.log('[5/7] 异常测试：管理员无理由驳回...');
    try {
      await axios.put(`${BASE_URL}/honor/applications/${applicationId}/review`, {
        status: 'rejected',
        reject_reason: ''
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.fail('应当拦截无理由驳回');
    } catch (e) {
      assert.equal(e.response.status, 400, '应当返回 400 错误');
      console.log('✅ 成功拦截无理由驳回');
    }

    // 6. 管理员审核通过
    console.log('[6/7] 管理员审核通过...');
    await axios.put(`${BASE_URL}/honor/applications/${applicationId}/review`, {
      status: 'approved'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✅ 审核通过成功');

    // 7. 学生/画像拉取数据验证
    console.log('[7/7] 验证画像模块数据同步...');
    const honorRes = await axios.get(`${BASE_URL}/honor/students/student_123/honors`, { headers: { Authorization: `Bearer ${studentToken}` } });
    const userHonor = honorRes.data.data.find(h => h.application_id === applicationId);
    assert.ok(userHonor, '未在荣誉库中找到数据，数据同步失败');
    assert.equal(userHonor.category_name, '测试自动化奖学金', '同步的数据异常');
    console.log('✅ 数据同步验证成功');

    console.log('--- 所有测试用例执行通过 ---');

  } catch (error) {
    console.error('❌ 测试失败:', error.message || error.response?.data || error);
  }
}

runTests();
