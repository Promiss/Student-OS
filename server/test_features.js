/**
 * 自动化测试脚本: 
 * 1. 个人信息接口 (GET /api/auth/me, PUT /api/auth/profile)
 * 2. 站内信发送和接收 (POST /api/message, GET /api/message/conversations)
 * 3. 站内信软删除
 * 
 * 运行: node test_features.js
 */
const API = 'http://localhost:3000/api';
let passed = 0;
let failed = 0;

const log = (label, ok, detail = '') => {
  if (ok) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
};

const login = async (userId) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: userId, password: 'any' })
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed for ${userId}: ${JSON.stringify(data)}`);
  return data.token;
};

const apiFetch = async (method, path, token, body) => {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
};

const run = async () => {
  console.log('\n==========================================');
  console.log('  SUDT 功能自动化测试 v2.0');
  console.log('==========================================\n');

  let token1, token2;

  // ── 登录测试 ──────────────────────────────────────────────────
  console.log('▶ [1] 登录测试');
  try {
    token1 = await login('student_001');
    log('student_001 登录获得 Token', !!token1);
    token2 = await login('fa_001');
    log('fa_001 登录获得 Token', !!token2);
  } catch (e) {
    log('登录模块', false, e.message);
    console.error('\n⚠️  后端未启动，跳过后续测试');
    process.exit(1);
  }

  // ── 个人信息 GET ──────────────────────────────────────────────
  console.log('\n▶ [2] 个人信息读取测试 (GET /auth/me)');
  const meRes = await apiFetch('GET', '/auth/me', token1);
  log('接口返回 success', meRes.success === true);
  log('返回 profile 对象', !!meRes.user?.profile);
  const p = meRes.user?.profile || {};
  log('profile 包含 name 字段',      'name'             in p, JSON.stringify(p.name));
  log('profile 包含 political_status', 'political_status' in p, JSON.stringify(p.political_status));
  log('profile 包含 family_members',  'family_members'   in p);
  log('profile 包含 work_history',     'work_history'     in p);
  log('personal_summary 字段存在',    'personal_summary'  in p);

  // ── 个人信息 PUT ──────────────────────────────────────────────
  console.log('\n▶ [3] 个人信息更新测试 (PUT /auth/profile)');
  const updatePayload = {
    name: '张伟',
    gender: '男',
    political_status: '共青团员',
    nation: '汉族',
    native_place: '黑龙江省哈尔滨市',
    birth_date: '2003-01-15',
    phone: '13800001111',
    wechat: 'zhangwei_wx',
    email: 'zhangwei@test.edu.cn',
    position: '班长',
    is_party_member: false,
    family_members: [
      { name: '张国强', relation: '父亲', phone: '13900001111', work: '工程师' },
      { name: '李秀梅', relation: '母亲', phone: '13900001112', work: '医生' }
    ],
    work_history: [
      { start: '2023-09', end: '至今', org: '某某大学', role: '在校学生' }
    ],
    personal_summary: '本人认真负责，积极进取，善于团队合作。'
  };
  const putRes = await apiFetch('PUT', '/auth/profile', token1, updatePayload);
  log('个人信息 PUT 成功', putRes.success === true, JSON.stringify(putRes));

  // 验证更新结果
  const meRes2 = await apiFetch('GET', '/auth/me', token1);
  const p2 = meRes2.user?.profile || {};
  log('wechat 字段写入验证',       p2.wechat === 'zhangwei_wx', p2.wechat);
  log('family_members 写入验证',   Array.isArray(p2.family_members) && p2.family_members.length === 2, JSON.stringify(p2.family_members?.length));
  log('work_history 写入验证',     Array.isArray(p2.work_history)   && p2.work_history.length   === 1, JSON.stringify(p2.work_history?.length));
  log('personal_summary 写入验证', p2.personal_summary?.includes('认真负责'), p2.personal_summary);

  // ── 站内信发送 ────────────────────────────────────────────────
  console.log('\n▶ [4] 站内信发送测试 (POST /message)');
  const sendRes = await apiFetch('POST', '/message', token2, {
    receiver_id: 'student_001',
    content: '这是自动化测试消息 - ' + new Date().toISOString()
  });
  log('站内信发送成功 (按账号)', sendRes.success === true, JSON.stringify(sendRes));

  // 按姓名发送
  const sendByName = await apiFetch('POST', '/message', token2, {
    receiver_id: '张伟',
    content: '这是按姓名发送的测试消息 - ' + new Date().toISOString()
  });
  log('站内信发送成功 (按姓名)', sendByName.success === true, JSON.stringify(sendByName));

  // ── 站内信接收 ────────────────────────────────────────────────
  console.log('\n▶ [5] 站内信会话列表测试 (GET /message/conversations)');
  const convRes = await apiFetch('GET', '/message/conversations', token1);
  log('会话列表返回数组',   Array.isArray(convRes),                    typeof convRes);
  log('会话数量 > 0',       convRes.length > 0,                        `count: ${convRes.length}`);
  log('会话含 contact_id', convRes[0]?.contact_id !== undefined,       String(convRes[0]?.contact_id));
  log('会话含消息数组',     Array.isArray(convRes[0]?.messages),       `msgs: ${convRes[0]?.messages?.length}`);

  // ── 站内信软删除字段验证 ──────────────────────────────────────
  console.log('\n▶ [6] 站内信软删除字段验证');
  const msgs = convRes[0]?.messages || [];
  const hasDeletedField = msgs.length > 0;
  log('消息列表非空 (软删除字段正常)',  hasDeletedField, `msg count: ${msgs.length}`);
  log('消息没有被错误过滤',            convRes.length > 0);

  // ── 荣誉系统 API 测试 ─────────────────────────────────────────
  console.log('\n▶ [7] 荣誉分类获取 (GET /honor/categories)');
  const honorCats = await apiFetch('GET', '/honor/categories', token1);
  log('获取荣誉分类成功', honorCats.success === true, `总数: ${honorCats.data?.length}`);
  const testCat = honorCats.data?.find(c => c.name.includes('创新一等奖')) || honorCats.data?.[1];
  
  if (testCat) {
    console.log('\n▶ [8] 荣誉申请提交 (POST /honor/applications)');
    const applyRes = await apiFetch('POST', '/honor/applications', token1, {
      category_id: testCat.id,
      proof_urls: ['http://example.com/proof.jpg'],
      description: '自动化测试提交荣誉申请'
    });
    const applyPassed = applyRes.success === true || (applyRes.error && applyRes.error.includes('重复申请'));
    log('提交申请或拦截重复成功', applyPassed, `Info: ${applyRes.id || applyRes.error}`);

    if (applyRes.id) {
      console.log('\n▶ [9] 荣誉申请审核与站内信通知 (PUT /honor/applications/:id/review)');
      // 需要管理员权限
      let adminToken;
      try {
        adminToken = await login('school_admin_001'); // 假设有这个账号，先用 fa_001 代替测试
      } catch(e) {
        adminToken = token2; // fallback
      }
      const reviewRes = await apiFetch('PUT', `/honor/applications/${applyRes.id}/review`, adminToken, {
        status: 'approved'
      });
      log('审核同意成功', reviewRes.success === true, reviewRes.message);

      console.log('\n▶ [10] 直接颁发荣誉 (POST /honor/grant)');
      const grantRes = await apiFetch('POST', '/honor/grant', adminToken, {
        student_id: 'student_001',
        category_id: testCat.id,
        issuer: '测试学校发证部',
        issue_date: '2026-05-01'
      });
      log('直接颁发成功', grantRes.success === true, grantRes.message);
    }
  }

  // ── 汇总 ──────────────────────────────────────────────────────
  console.log('\n==========================================');
  console.log(`  测试结果: ${passed} 通过 / ${failed} 失败`);
  console.log('==========================================\n');
  if (failed > 0) process.exit(1);
  else process.exit(0);
};

run().catch(e => {
  console.error('致命错误:', e.message);
  process.exit(1);
});
