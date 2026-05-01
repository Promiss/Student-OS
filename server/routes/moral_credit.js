/**
 * routes/moral_credit.js
 * 德育分管理路由 - 挂载于 /api/credit
 *
 * 路由清单:
 *   GET    /api/credit                  获取所有记录（多维筛选）
 *   GET    /api/credit/summary          德育分余额排行榜
 *   GET    /api/credit/balance/:id      指定学生余额
 *   GET    /api/credit/scope-preview    批量发放前范围预览
 *   GET    /api/credit/groups           学院/班级分组列表
 *   POST   /api/credit                  单条发放/扣减
 *   POST   /api/credit/batch            批量发放 (list/scope/excel)
 *   POST   /api/credit/batch-grant      批量荣誉发放
 *   PUT    /api/credit/:id/status       审核记录
 *   DELETE /api/credit/:id              撤销记录
 */

import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 权限检查
const isAdmin = (user) =>
  ['school_admin', 'super_admin', 'college_admin', 'counselor'].includes(user.role);

// 发站内信
const sendMsg = async (sender_id, receiver_id, content) => {
  try {
    await pool.query('INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [sender_id, receiver_id, content]);
  } catch (e) { console.error('发站内信失败:', e.message); }
};

const msgHtml = (title, body, color = '#3b82f6') =>
  `<div style="padding:14px 16px;border-left:4px solid ${color};background:#f8fafc;border-radius:8px;">
    <h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">${title}</h4>
    <p style="margin:0;color:#475569;line-height:1.6;">${body}</p>
  </div>`;

function getActivityTypeName(type) {
  return {
    volunteer: '志愿服务', social_practice: '社会实践', activity: '校园活动',
    honor_apply: '荣誉申请', competition: '竞赛获奖', discipline: '纪律处分', manual: '手动录入'
  }[type] || type;
}

// ─────────────────────────────────────────────────────────────
//  GET /api/credit  获取所有德育分记录（支持多维筛选）
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { keyword, status, activity_type, college, class_name, page = 1, limit = 50 } = req.query;
  try {
    const where = [];
    const params = [];
    if (keyword) { where.push('(mc.student_id LIKE ? OR s.name LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
    if (status && status !== 'all') { where.push('mc.status = ?'); params.push(status); }
    if (activity_type && activity_type !== 'all') { where.push('mc.activity_type = ?'); params.push(activity_type); }
    if (college) { where.push('s.college LIKE ?'); params.push(`%${college}%`); }
    if (class_name) { where.push('s.class_name LIKE ?'); params.push(`%${class_name}%`); }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT mc.*, s.name AS student_name, s.class_name, s.college
       FROM moral_credit mc
       LEFT JOIN student s ON mc.student_id = s.id
       ${whereStr}
       ORDER BY mc.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM moral_credit mc LEFT JOIN student s ON mc.student_id = s.id ${whereStr}`,
      params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error('获取德育分记录失败:', e);
    res.status(500).json({ error: '获取德育分记录失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/credit/summary  德育分余额排行榜
// ─────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { college, class_name } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT
        s.id AS student_id, s.name AS student_name, s.class_name, s.college,
        COALESCE(SUM(CASE WHEN mc.status='approved' THEN mc.credit_change ELSE 0 END), 0) AS balance,
        COALESCE(SUM(CASE WHEN mc.status='approved' AND mc.credit_change > 0 THEN mc.credit_change ELSE 0 END), 0) AS total_add,
        COALESCE(ABS(SUM(CASE WHEN mc.status='approved' AND mc.credit_change < 0 THEN mc.credit_change ELSE 0 END)), 0) AS total_deduct,
        COUNT(CASE WHEN mc.status='approved' THEN 1 END) AS record_count
       FROM student s
       LEFT JOIN moral_credit mc ON mc.student_id = s.id
       WHERE s.id LIKE 'student%'
       ${college ? 'AND s.college LIKE ?' : ''}
       ${class_name ? 'AND s.class_name LIKE ?' : ''}
       GROUP BY s.id
       ORDER BY balance DESC`,
      [...(college ? [`%${college}%`] : []), ...(class_name ? [`%${class_name}%`] : [])]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: '获取德育分汇总失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/credit/scope-preview  批量发放前预览受影响学生
//  注意：必须在 /balance/:id 之前注册，避免 :id 匹配到 scope-preview
// ─────────────────────────────────────────────────────────────
router.get('/scope-preview', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { type, value } = req.query;
  try {
    let whereClause = "WHERE id LIKE 'student%'";
    const qParams = [];
    if (type === 'college' && value) { whereClause += ' AND college = ?'; qParams.push(value); }
    else if (type === 'class' && value) { whereClause += ' AND class_name = ?'; qParams.push(value); }

    const [students] = await pool.query(
      `SELECT id AS student_id, name AS student_name, class_name, college FROM student ${whereClause}`,
      qParams
    );
    res.json({ success: true, data: students, count: students.length });
  } catch (e) {
    res.status(500).json({ error: '预览失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/credit/groups  获取学院/班级分组列表
// ─────────────────────────────────────────────────────────────
router.get('/groups', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  try {
    const [colleges] = await pool.query(
      `SELECT DISTINCT college, COUNT(*) as student_count FROM student WHERE id LIKE 'student%' AND college IS NOT NULL GROUP BY college`
    );
    const [classes] = await pool.query(
      `SELECT DISTINCT class_name, college, COUNT(*) as student_count FROM student WHERE id LIKE 'student%' AND class_name IS NOT NULL GROUP BY class_name, college`
    );
    res.json({ success: true, colleges, classes });
  } catch (e) {
    res.status(500).json({ error: '获取分组数据失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/credit/balance/:student_id  查询指定学生德育分余额
// ─────────────────────────────────────────────────────────────
router.get('/balance/:student_id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  try {
    const [[row]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN status='approved' THEN credit_change ELSE 0 END), 0) AS balance
       FROM moral_credit WHERE student_id=?`,
      [req.params.student_id]
    );
    res.json({ success: true, balance: parseFloat(row.balance) || 0 });
  } catch (e) {
    res.status(500).json({ error: '获取余额失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/credit  单条德育分发放/扣减
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { student_id, credit_change, reason, activity_type = 'manual', auto_approve = true } = req.body;
  if (!student_id || credit_change === undefined || !reason) {
    return res.status(400).json({ error: '缺少必填项' });
  }
  try {
    const [[stu]] = await pool.query('SELECT name FROM student WHERE id=?', [student_id]);
    if (!stu) return res.status(404).json({ error: '学生不存在' });

    const status = auto_approve ? 'approved' : 'pending';
    const [result] = await pool.query(
      `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status, activity_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, parseFloat(credit_change), reason, req.user.id, status, activity_type]
    );

    const isAdd = parseFloat(credit_change) > 0;
    await sendMsg('admin_sys', student_id, msgHtml(
      isAdd ? '🌟 德育分加分通知' : '⚠️ 德育分扣分通知',
      `您的德育分已${isAdd ? '增加' : '扣减'} <strong>${Math.abs(credit_change)} 分</strong>。<br>
       原因：${reason}<br>
       来源类型：${getActivityTypeName(activity_type)}`,
      isAdd ? '#10b981' : '#f59e0b'
    ));

    res.json({ success: true, message: `已${isAdd ? '加' : '扣'} ${Math.abs(credit_change)} 分`, id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: '操作失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/credit/batch  批量德育分发放
//  mode='list'   → 指定学生ID列表（统一分值）
//  mode='scope'  → 按范围（全体/学院/班级）
//  mode='excel'  → Excel 解析后的 [{student_id, credit_change, reason?}]
// ─────────────────────────────────────────────────────────────
router.post('/batch', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { mode, items, scope, reason, credit_change, activity_type = 'manual', auto_approve = true } = req.body;

  if (!reason) return res.status(400).json({ error: '请填写发放原因' });

  try {
    let targets = [];

    if (mode === 'list') {
      if (!Array.isArray(items) || !credit_change) return res.status(400).json({ error: '参数不完整（list模式需要 items 和 credit_change）' });
      targets = items.map(id => ({ student_id: id, credit_change: parseFloat(credit_change) }));

    } else if (mode === 'scope') {
      if (!scope || !credit_change) return res.status(400).json({ error: '参数不完整（scope模式需要 scope 和 credit_change）' });
      let whereClause = "WHERE id LIKE 'student%'";
      const qParams = [];
      if (scope.type === 'college' && scope.value) { whereClause += ' AND college = ?'; qParams.push(scope.value); }
      else if (scope.type === 'class' && scope.value) { whereClause += ' AND class_name = ?'; qParams.push(scope.value); }
      const [students] = await pool.query(`SELECT id FROM student ${whereClause}`, qParams);
      targets = students.map(s => ({ student_id: s.id, credit_change: parseFloat(credit_change) }));

    } else if (mode === 'excel') {
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: '导入数据为空' });
      for (const item of items) {
        if (!item.student_id || item.credit_change === undefined) {
          return res.status(400).json({ error: `行数据不完整: ${JSON.stringify(item)}` });
        }
      }
      targets = items.map(item => ({
        student_id: item.student_id,
        credit_change: parseFloat(item.credit_change),
        reason: item.reason || reason
      }));
    } else {
      return res.status(400).json({ error: '无效的发放模式，支持 list/scope/excel' });
    }

    if (targets.length === 0) return res.status(400).json({ error: '没有符合条件的学生' });

    const status = auto_approve ? 'approved' : 'pending';
    let successCount = 0;
    const errors = [];

    await pool.query('START TRANSACTION');
    for (const t of targets) {
      const rowReason = t.reason || reason;
      const [[stu]] = await pool.query('SELECT name FROM student WHERE id=?', [t.student_id]);
      if (!stu) { errors.push({ student_id: t.student_id, error: '学生不存在' }); continue; }

      await pool.query(
        `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status, activity_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [t.student_id, t.credit_change, rowReason, req.user.id, status, activity_type]
      );

      const isAdd = t.credit_change > 0;
      await sendMsg('admin_sys', t.student_id, msgHtml(
        isAdd ? '🌟 德育分加分通知' : '⚠️ 德育分扣分通知',
        `您的德育分已${isAdd ? '增加' : '扣减'} <strong>${Math.abs(t.credit_change)} 分</strong>。<br>
         原因：${rowReason}<br>来源类型：${getActivityTypeName(activity_type)}`,
        isAdd ? '#10b981' : '#f59e0b'
      ));
      successCount++;
    }
    await pool.query('COMMIT');

    res.json({
      success: true,
      message: `批量操作完成：成功 ${successCount} 条${errors.length ? `，失败 ${errors.length} 条` : ''}`,
      successCount, errors
    });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: '批量操作失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/credit/batch-grant  批量荣誉发放
//  items: [{student_id, category_id, issuer?, issue_date?}]
// ─────────────────────────────────────────────────────────────
router.post('/batch-grant', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { items, issuer, issue_date } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '发放列表为空' });
  }
  try {
    const date = issue_date || new Date().toISOString().split('T')[0];
    const issuerName = issuer || '学校官方';
    let successCount = 0;
    const errors = [];

    await pool.query('START TRANSACTION');
    for (const item of items) {
      if (!item.student_id || !item.category_id) {
        errors.push({ item, error: '缺少学生ID或荣誉类型' }); continue;
      }
      const [[cat]] = await pool.query('SELECT * FROM honor_categories WHERE id=? AND status=1', [item.category_id]);
      if (!cat) { errors.push({ item, error: '荣誉类型不存在' }); continue; }
      const [[stu]] = await pool.query('SELECT name FROM student WHERE id=?', [item.student_id]);
      if (!stu) { errors.push({ item, error: '学生不存在' }); continue; }

      await pool.query(
        `INSERT INTO student_honors (student_id, category_id, issue_date, issuer) VALUES (?, ?, ?, ?)`,
        [item.student_id, item.category_id, item.issue_date || date, item.issuer || issuerName]
      );

      await sendMsg('admin_sys', item.student_id, msgHtml(
        `🏅 恭喜您荣获荣誉称号！`,
        `经校方审核颁发，您已获得「<strong>${cat.name}（${cat.level}）</strong>」荣誉证书！`,
        '#f59e0b'
      ));
      successCount++;
    }
    await pool.query('COMMIT');
    res.json({ success: true, message: `批量颁发完成：成功 ${successCount} 条`, successCount, errors });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: '批量颁发失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  PUT /api/credit/:id/status  审核德育分记录
// ─────────────────────────────────────────────────────────────
router.put('/:id/status', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: '无效状态' });
  try {
    const [[record]] = await pool.query('SELECT * FROM moral_credit WHERE id=?', [req.params.id]);
    if (!record) return res.status(404).json({ error: '记录不存在' });
    await pool.query('UPDATE moral_credit SET status=?, operated_by=? WHERE id=?', [status, req.user.id, req.params.id]);

    if (status === 'approved') {
      const isAdd = record.credit_change > 0;
      await sendMsg('admin_sys', record.student_id, msgHtml(
        isAdd ? '✅ 德育加分已审核通过' : '✅ 德育扣分记录已确认',
        `您的德育分变动（${isAdd ? '+' : ''}${record.credit_change} 分）已通过审核。<br>原因：${record.reason}`,
        '#10b981'
      ));
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '审核失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  DELETE /api/credit/:id  撤销德育分记录
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  try {
    const [[record]] = await pool.query('SELECT * FROM moral_credit WHERE id=?', [req.params.id]);
    if (!record) return res.status(404).json({ error: '记录不存在' });
    await pool.query('DELETE FROM moral_credit WHERE id=?', [req.params.id]);
    res.json({ success: true, message: '已撤销该德育分记录' });
  } catch (e) {
    res.status(500).json({ error: '撤销失败: ' + e.message });
  }
});

export default router;
