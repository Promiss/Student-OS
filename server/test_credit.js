/**
 * test_credit.js  —  德育分管理 & 批量荣誉发放 API 自动化测试脚本
 * 运行: node test_credit.js
 * 日志: test_credit.log（UTF-8 编码）
 */

import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE  = 'http://localhost:3000';
const LOG   = path.join(__dirname, 'test_credit.log');

// ── 日志工具：强制 UTF-8 输出 ─────────────────────────────────
const logStream = fs.createWriteStream(LOG, { flags: 'w', encoding: 'utf8' });

function log(msg) {
  const line = `${new Date().toISOString()}  ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}
function logSection(title) {
  const line = `\n${'═'.repeat(60)}\n  ${title}\n${'═'.repeat(60)}`;
  console.log(line);
  logStream.write(line + '\n');
}

// ── HTTP 工具 ────────────────────────────────────────────────
function request(method, urlPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data   ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, res => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', c => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── 断言工具 ─────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    log(`  ❌ FAIL  ${label}  ${detail}`);
    failed++;
  }
}

// ── 登录，获取 token ─────────────────────────────────────────
async function login(username) {
  const res = await request('POST', '/api/auth/login', { username, password: '123456' });
  if (res.body?.token) {
    log(`  🔑 Login OK: ${username} (role=${res.body.user_info?.role})`);
    return res.body.token;
  }
  throw new Error(`Login failed for ${username}: ${JSON.stringify(res.body)}`);
}

// ════════════════════════════════════════════════════════════
//  主测试流程
// ════════════════════════════════════════════════════════════
async function main() {
  logStream.write('\uFEFF'); // BOM 头，确保 Windows 记事本识别 UTF-8
  logSection('🚀 SUDT 德育分管理 & 批量荣誉发放  API 测试报告');
  log(`测试目标: ${BASE}`);
  log(`日志文件: ${LOG}`);

  // ── 1. 登录获取各角色 Token ──────────────────────────────
  logSection('❶  登录 & Token 获取');
  let adminToken, counselorToken, studentToken;
  try {
    adminToken    = await login('su_001');
    counselorToken = await login('fa_001');
    studentToken  = await login('student_001');
  } catch (e) {
    log(`  💥 登录失败，终止测试: ${e.message}`);
    return finish();
  }

  // ── 2. 权限检查 ─────────────────────────────────────────
  logSection('❷  权限校验（无 Token / 学生身份）');

  let r = await request('GET', '/api/credit');
  assert('无 Token 访问 GET /credit 返回 401', r.status === 401);

  r = await request('GET', '/api/credit', null, studentToken);
  assert('学生身份访问 GET /credit 返回 403', r.status === 403);

  r = await request('POST', '/api/credit', { student_id:'student_001', credit_change: 1, reason:'test' }, studentToken);
  assert('学生身份 POST /credit 返回 403', r.status === 403);

  // ── 3. 分组列表 ─────────────────────────────────────────
  logSection('❸  GET /credit/groups  学院/班级分组');

  r = await request('GET', '/api/credit/groups', null, adminToken);
  assert('获取分组数据成功', r.body?.success === true);
  assert('返回 colleges 数组', Array.isArray(r.body?.colleges));
  assert('返回 classes 数组', Array.isArray(r.body?.classes));
  log(`     学院数量: ${r.body?.colleges?.length}  班级数量: ${r.body?.classes?.length}`);

  // ── 4. 德育分记录列表 ────────────────────────────────────
  logSection('❹  GET /credit  德育分记录列表');

  r = await request('GET', '/api/credit', null, adminToken);
  assert('获取德育分记录成功', r.body?.success === true);
  assert('记录总量 > 0', r.body?.total > 0, `total=${r.body?.total}`);
  log(`     总记录数: ${r.body?.total}`);

  r = await request('GET', '/api/credit?status=approved', null, adminToken);
  assert('按状态筛选 approved', r.body?.success === true && r.body?.data?.length >= 0);

  r = await request('GET', '/api/credit?activity_type=volunteer', null, adminToken);
  assert('按来源类型筛选 volunteer', r.body?.success === true);

  const kw = new URLSearchParams({ keyword: '张伟' });
  r = await request('GET', `/api/credit?${kw}`, null, adminToken);
  assert('按关键词筛选姓名', r.body?.success === true);

  // ── 5. 德育分余额汇总 ────────────────────────────────────
  logSection('❺  GET /credit/summary  余额排行榜');

  r = await request('GET', '/api/credit/summary', null, adminToken);
  assert('获取余额汇总成功', r.body?.success === true);
  assert('返回数组', Array.isArray(r.body?.data));
  if (r.body?.data?.length) {
    const top = r.body.data[0];
    log(`     榜首: ${top.student_name}  余额=${top.balance}  加分=${top.total_add}  扣分=${top.total_deduct}`);
    assert('余额字段存在', top.balance !== undefined);
    assert('加分字段存在', top.total_add !== undefined);
    assert('扣分字段存在', top.total_deduct !== undefined);
  }

  // ── 6. 指定学生余额 ──────────────────────────────────────
  logSection('❻  GET /credit/balance/:id  指定学生余额');

  r = await request('GET', '/api/credit/balance/student_001', null, adminToken);
  assert('获取 student_001 余额成功', r.body?.success === true);
  assert('余额为数字', typeof r.body?.balance === 'number', `balance=${r.body?.balance}`);
  log(`     student_001 德育分余额: ${r.body?.balance}`);

  r = await request('GET', '/api/credit/balance/student_002', null, adminToken);
  assert('获取 student_002 余额成功', r.body?.success === true);
  log(`     student_002 德育分余额: ${r.body?.balance}`);

  // ── 7. 范围预览 ──────────────────────────────────────────
  logSection('❼  GET /credit/scope-preview  批量发放前范围预览');

  r = await request('GET', '/api/credit/scope-preview?type=all', null, adminToken);
  assert('全体学生范围预览成功', r.body?.success === true);
  assert('全体学生数量 > 0', r.body?.count > 0, `count=${r.body?.count}`);
  log(`     全体学生: ${r.body?.count} 人`);

  r = await request('GET', `/api/credit/scope-preview?type=college&value=${encodeURIComponent('计算机学院')}`, null, adminToken);
  assert('计算机学院范围预览成功', r.body?.success === true);
  log(`     计算机学院学生: ${r.body?.count} 人`);

  // ── 8. 单条発放 ──────────────────────────────────────────
  logSection('❽  POST /credit  单条德育分发放');

  r = await request('POST', '/api/credit', {
    student_id: 'student_001',
    credit_change: 2.5,
    reason: '测试脚本:参与社区志愿服务',
    activity_type: 'volunteer',
    auto_approve: true
  }, adminToken);
  assert('单条加分发放成功', r.body?.success === true, JSON.stringify(r.body));
  const singleId = r.body?.id;
  log(`     新建记录 ID: ${singleId}`);

  r = await request('POST', '/api/credit', {
    student_id: 'student_002',
    credit_change: -1.0,
    reason: '测试脚本:纪律违规扣分',
    activity_type: 'discipline',
    auto_approve: false  // pending 待审核
  }, counselorToken);
  assert('辅导员发放待审核扣分成功', r.body?.success === true, JSON.stringify(r.body));
  const pendingId = r.body?.id;

  // 参数校验
  r = await request('POST', '/api/credit', {
    student_id: 'student_001',
    credit_change: 1
    // 缺少 reason
  }, adminToken);
  assert('缺少 reason 返回 400', r.status === 400, `status=${r.status}`);

  r = await request('POST', '/api/credit', {
    student_id: 'notexist_user',
    credit_change: 1,
    reason: '不存在学生'
  }, adminToken);
  assert('学生不存在返回 404', r.status === 404, `status=${r.status}`);

  // ── 9. 批量发放 mode=scope ───────────────────────────────
  logSection('❾  POST /credit/batch  批量范围发放');

  r = await request('POST', '/api/credit/batch', {
    mode: 'scope',
    scope: { type: 'all' },
    credit_change: 0.5,
    reason: '测试脚本:全体学生参与2026校运会',
    activity_type: 'activity',
    auto_approve: true
  }, adminToken);
  assert('全体范围批量发放成功', r.body?.success === true, JSON.stringify(r.body));
  log(`     成功: ${r.body?.successCount}  失败: ${r.body?.errors?.length || 0}`);

  r = await request('POST', '/api/credit/batch', {
    mode: 'scope',
    scope: { type: 'college', value: '计算机学院' },
    credit_change: 1.0,
    reason: '测试脚本:计算机学院参与AI实践周',
    activity_type: 'social_practice',
    auto_approve: true
  }, adminToken);
  assert('按学院批量发放成功', r.body?.success === true, JSON.stringify(r.body));
  log(`     计算机学院发放: 成功 ${r.body?.successCount} 人`);

  // ── 10. 批量发放 mode=list ───────────────────────────────
  logSection('❿  POST /credit/batch  mode=list 指定名单');

  r = await request('POST', '/api/credit/batch', {
    mode: 'list',
    items: ['student_001', 'student_002', 'student_005'],
    credit_change: 3.0,
    reason: '测试脚本:三人省级大赛获奖',
    activity_type: 'competition',
    auto_approve: true
  }, adminToken);
  assert('list 模式批量发放成功', r.body?.success === true, JSON.stringify(r.body));
  assert('成功数量为 3', r.body?.successCount === 3, `successCount=${r.body?.successCount}`);

  // ── 11. 批量发放 mode=excel ──────────────────────────────
  logSection('⓫  POST /credit/batch  mode=excel Excel 导入');

  const excelItems = [
    { student_id: 'student_003', credit_change: 2.0, reason: 'Excel导入:志愿服务10小时', activity_type: 'volunteer' },
    { student_id: 'student_004', credit_change: 1.5, reason: 'Excel导入:参加读书节活动', activity_type: 'activity' },
    { student_id: 'student_005', credit_change: -0.5, reason: 'Excel导入:作业提交迟到扣分', activity_type: 'discipline' },
  ];
  r = await request('POST', '/api/credit/batch', {
    mode: 'excel',
    items: excelItems,
    reason: '统一备注原因'
  }, adminToken);
  assert('excel 模式批量发放成功', r.body?.success === true, JSON.stringify(r.body));
  assert('Excel 导入成功数 = 3', r.body?.successCount === 3, `successCount=${r.body?.successCount}`);

  // excel 模式参数校验：缺少 student_id
  r = await request('POST', '/api/credit/batch', {
    mode: 'excel',
    items: [{ credit_change: 1 }],
    reason: '原因'
  }, adminToken);
  assert('excel 模式缺少 student_id 返回 400', r.status === 400, `status=${r.status}`);

  // ── 12. 审核德育分记录 ───────────────────────────────────
  logSection('⓬  PUT /credit/:id/status  审核记录');

  if (pendingId) {
    r = await request('PUT', `/api/credit/${pendingId}/status`, { status: 'approved' }, adminToken);
    assert(`审核通过记录 #${pendingId}`, r.body?.success === true, JSON.stringify(r.body));

    // 再次通过（已不是 pending，但接口应仍允许修改状态）
    r = await request('PUT', `/api/credit/${pendingId}/status`, { status: 'rejected' }, adminToken);
    assert(`撤回为 rejected 记录 #${pendingId}`, r.body?.success === true, JSON.stringify(r.body));
  }

  // 无效状态
  if (pendingId) {
    r = await request('PUT', `/api/credit/${pendingId}/status`, { status: 'invalid_status' }, adminToken);
    assert('无效状态返回 400', r.status === 400, `status=${r.status}`);
  }

  // ── 13. 删除/撤销记录 ───────────────────────────────────
  logSection('⓭  DELETE /credit/:id  撤销德育分记录');

  if (singleId) {
    r = await request('DELETE', `/api/credit/${singleId}`, null, adminToken);
    assert(`撤销记录 #${singleId} 成功`, r.body?.success === true, JSON.stringify(r.body));

    r = await request('DELETE', `/api/credit/${singleId}`, null, adminToken);
    assert('重复撤销返回 404', r.status === 404, `status=${r.status}`);
  }

  // ── 14. 批量荣誉发放 ────────────────────────────────────
  logSection('⓮  POST /credit/batch-grant  批量荣誉发放');

  r = await request('POST', '/api/credit/batch-grant', {
    items: [
      { student_id: 'student_001', category_id: 8 },
      { student_id: 'student_002', category_id: 7 },
    ],
    issuer: '某某大学学工处',
    issue_date: '2026-04-08'
  }, adminToken);
  assert('批量荣誉发放成功', r.body?.success === true, JSON.stringify(r.body));
  assert('发放成功数为 2', r.body?.successCount === 2, `successCount=${r.body?.successCount}`);

  // 发放不存在的学生
  r = await request('POST', '/api/credit/batch-grant', {
    items: [{ student_id: 'ghost_user', category_id: 8 }],
    issuer: '测试机构'
  }, adminToken);
  assert('发放给不存在学生 successCount=0', r.body?.successCount === 0);
  assert('错误列表有1条', r.body?.errors?.length === 1);

  // 空列表
  r = await request('POST', '/api/credit/batch-grant', { items: [] }, adminToken);
  assert('空列表返回 400', r.status === 400, `status=${r.status}`);

  // ── 15. 最终余额验证（前后对比）──────────────────────────
  logSection('⓯  最终德育分余额验证');

  for (const sid of ['student_001', 'student_002', 'student_003', 'student_004', 'student_005']) {
    r = await request('GET', `/api/credit/balance/${sid}`, null, adminToken);
    assert(`${sid} 余额查询正常`, r.body?.success === true);
    log(`     ${sid} 最终余额: ${r.body?.balance}`);
  }

  finish();
}

function finish() {
  logSection('📊  测试汇总');
  log(`  通过: ${passed}`);
  log(`  失败: ${failed}`);
  log(`  总计: ${passed + failed}`);
  if (failed === 0) {
    log('\n  🎉 全部测试通过！德育分管理模块功能正常。');
  } else {
    log(`\n  ⚠️  有 ${failed} 项测试未通过，请检查上方 FAIL 日志。`);
  }
  log(`\n  日志已写入: ${LOG}`);
  logStream.end();
}

main().catch(e => {
  log(`\n💥 测试脚本异常终止: ${e.message}`);
  log(e.stack || '');
  finish();
});
