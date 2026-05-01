import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 权限检查辅助函数
const isAdmin = (user) =>
  ['school_admin', 'super_admin', 'college_admin', 'counselor'].includes(user.role);

// 发站内信辅助函数
const sendMsg = async (sender_id, receiver_id, content) => {
  try {
    await pool.query(
      'INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [sender_id, receiver_id, content]
    );
  } catch(e) {
    console.error('发站内信失败:', e.message);
  }
};

const msgHtml = (title, body, color = '#3b82f6') =>
  `<div style="padding:14px 16px;border-left:4px solid ${color};background:#f8fafc;border-radius:8px;">
    <h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">${title}</h4>
    <p style="margin:0;color:#475569;line-height:1.6;">${body}</p>
  </div>`;

// ─────────────────────────────────────────────────────────────
//  荣誉类别 CRUD
// ─────────────────────────────────────────────────────────────
// GET /honor/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM honor_categories WHERE status = 1 ORDER BY sort_order, id'
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: '获取荣誉类型失败' });
  }
});

// POST /honor/categories (管理员)
router.post('/categories', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { name, level, description, icon, require_credit_deduction, credit_cost, credit_reward } = req.body;
  if (!name || !level) return res.status(400).json({ error: '缺少必填项' });
  try {
    const [result] = await pool.query(
      `INSERT INTO honor_categories (name, level, description, icon, require_credit_deduction, credit_cost, credit_reward)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, level, description || '', icon || '🏅',
       require_credit_deduction ? 1 : 0, credit_cost || 0, credit_reward || 0]
    );
    res.json({ success: true, data: { id: result.insertId, name, level } });
  } catch (e) {
    res.status(500).json({ error: '创建荣誉类型失败: ' + e.message });
  }
});

// PUT /honor/categories/:id (管理员)
router.put('/categories/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { name, level, description, icon, require_credit_deduction, credit_cost, credit_reward, status } = req.body;
  try {
    await pool.query(
      `UPDATE honor_categories SET name=?, level=?, description=?, icon=?,
       require_credit_deduction=?, credit_cost=?, credit_reward=?, status=? WHERE id=?`,
      [name, level, description || '', icon || '🏅',
       require_credit_deduction ? 1 : 0, credit_cost || 0, credit_reward || 0,
       status !== undefined ? status : 1, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '更新失败: ' + e.message });
  }
});

// DELETE /honor/categories/:id (管理员)
router.delete('/categories/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  try {
    await pool.query('UPDATE honor_categories SET status=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '删除失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  学生：提交申请
// ─────────────────────────────────────────────────────────────
// POST /honor/applications
router.post('/applications', async (req, res) => {
  const { category_id, proof_urls, description, confirmed_credit_deduction } = req.body;
  const student_id = req.user.id;

  if (!category_id || !proof_urls || proof_urls.length === 0) {
    return res.status(400).json({ error: '请上传至少一份证明材料' });
  }

  try {
    // 获取荣誉类别信息
    const [cats] = await pool.query('SELECT * FROM honor_categories WHERE id=? AND status=1', [category_id]);
    if (cats.length === 0) return res.status(404).json({ error: '荣誉类型不存在' });
    const cat = cats[0];

    // 检查是否已有待审/已通过的同类申请
    const [existing] = await pool.query(
      `SELECT id FROM honor_applications WHERE student_id=? AND category_id=? AND status IN ('pending','approved')`,
      [student_id, category_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '您已提交过此荣誉申请，请勿重复申请' });
    }

    // 德育分校验
    let creditDeducted = 0;
    if (cat.require_credit_deduction && cat.credit_cost > 0) {
      if (!confirmed_credit_deduction) {
        return res.status(400).json({ error: '请确认知悉将扣除德育分' });
      }
      // 查询余额
      const [[balance]] = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN status='approved' THEN credit_change ELSE 0 END), 0) AS bal
         FROM moral_credit WHERE student_id=?`, [student_id]
      );
      const bal = parseFloat(balance.bal) || 0;
      if (bal < cat.credit_cost) {
        return res.status(400).json({ error: `德育分余额不足（当前 ${bal} 分，需要 ${cat.credit_cost} 分）` });
      }
      // 扣除德育分
      await pool.query(
        `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status)
         VALUES (?, ?, ?, ?, 'approved')`,
        [student_id, -cat.credit_cost, `申请「${cat.name}」荣誉扣除德育分`, student_id]
      );
      creditDeducted = 1;
    }

    const [result] = await pool.query(
      `INSERT INTO honor_applications (student_id, category_id, proof_urls, description, credit_deducted)
       VALUES (?, ?, ?, ?, ?)`,
      [student_id, category_id, JSON.stringify(proof_urls), description || null, creditDeducted]
    );

    // 发站内信通知学生
    await sendMsg('admin_sys', student_id, msgHtml(
      '📋 荣誉申请已提交',
      `您的「<strong>${cat.name}（${cat.level}）</strong>」荣誉申请已成功提交，审核结果将通过站内信通知您。请耐心等待。`,
      '#3b82f6'
    ));

    // 通知管理员（school_admin）
    const [admins] = await pool.query(
      `SELECT id FROM student WHERE id LIKE 'admin%' OR id LIKE 'su_%' LIMIT 3`
    );
    for (const admin of admins) {
      await sendMsg('admin_sys', admin.id, msgHtml(
        '🔔 新荣誉申请待审核',
        `学生 <strong>${student_id}</strong> 提交了「${cat.name}」荣誉申请，请前往荣誉管理后台进行审核。`,
        '#f59e0b'
      ));
    }

    res.json({ success: true, message: '申请提交成功', data: { id: result.insertId } });
  } catch (e) {
    console.error('提交申请失败:', e);
    res.status(500).json({ error: '提交申请失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  学生：查询我的申请
// ─────────────────────────────────────────────────────────────
router.get('/applications/me', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS category_name, c.level AS category_level,
              c.template_url, c.icon, c.require_credit_deduction, c.credit_cost
       FROM honor_applications a
       JOIN honor_categories c ON a.category_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: '获取申请列表失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  管理员：获取所有申请（支持筛选）
// ─────────────────────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { status, keyword } = req.query;
  try {
    let where = [];
    let params = [];
    if (status && status !== 'all') { where.push('a.status = ?'); params.push(status); }
    if (keyword) { where.push('(a.student_id LIKE ? OR s.name LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
    const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.query(
      `SELECT a.*, c.name AS category_name, c.level AS category_level, c.icon,
              s.name AS student_name, s.class_name, s.college
       FROM honor_applications a
       JOIN honor_categories c ON a.category_id = c.id
       LEFT JOIN student s ON a.student_id = s.id
       ${whereStr}
       ORDER BY a.created_at DESC`,
      params
    );
    // 解析 JSON 字段
    const data = rows.map(r => ({
      ...r,
      proof_urls: typeof r.proof_urls === 'string' ? JSON.parse(r.proof_urls || '[]') : r.proof_urls
    }));
    res.json({ success: true, data });
  } catch (e) {
    console.error('获取申请列表失败:', e);
    res.status(500).json({ error: '获取申请列表失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  管理员：单条审核
// ─────────────────────────────────────────────────────────────
router.put('/applications/:id/review', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { id } = req.params;
  const { status, reject_reason } = req.body;
  const reviewer_id = req.user.id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效状态' });
  }
  if (status === 'rejected' && !reject_reason?.trim()) {
    return res.status(400).json({ error: '驳回必须填写理由' });
  }

  try {
    await pool.query('START TRANSACTION');
    const [appRows] = await pool.query(
      `SELECT a.*, c.name as cat_name, c.level as cat_level, c.credit_reward
       FROM honor_applications a JOIN honor_categories c ON a.category_id=c.id
       WHERE a.id=? FOR UPDATE`, [id]
    );
    if (appRows.length === 0) throw new Error('申请单不存在');
    const app = appRows[0];
    if (app.status !== 'pending') throw new Error('只能审核待处理的申请单');

    await pool.query(
      'UPDATE honor_applications SET status=?, reviewer_id=?, reject_reason=? WHERE id=?',
      [status, reviewer_id, reject_reason || null, id]
    );

    if (status === 'approved') {
      await pool.query(
        `INSERT INTO student_honors (student_id, category_id, application_id, issue_date, issuer)
         VALUES (?, ?, ?, CURDATE(), '学校官方')`,
        [app.student_id, app.category_id, app.id]
      );
      // 若该荣誉类型配置了赠送德育分，则自动发放
      const creditReward = parseFloat(app.credit_reward) || 0;
      if (creditReward > 0) {
        await pool.query(
          `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status, activity_type)
           VALUES (?, ?, ?, ?, 'approved', 'honor_apply')`,
          [app.student_id, creditReward, `获得「${app.cat_name}」荣誉，赠送德育积分`, reviewer_id]
        );
      }
      await sendMsg('admin_sys', app.student_id, msgHtml(
        `🎉 荣誉证书已颁发！`,
        `恭喜您！您申请的「<strong>${app.cat_name}（${app.cat_level}）</strong>」荣誉已通过审核并正式颁发，您可以在个人中心查看您的荣誉证书。${
          creditReward > 0 ? `<br>🌟 同时为您赠送 <strong>${creditReward} 德育积分</strong>，感谢您的积极参与！` : ''
        }`,
        '#10b981'
      ));
    } else {
      // 驳回时退回德育分
      if (app.credit_deducted) {
        const [[cat]] = await pool.query('SELECT credit_cost FROM honor_categories WHERE id=?', [app.category_id]);
        if (cat?.credit_cost > 0) {
          await pool.query(
            `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status)
             VALUES (?, ?, ?, ?, 'approved')`,
            [app.student_id, cat.credit_cost, `「${app.cat_name}」申请被驳回，退还德育分`, reviewer_id]
          );
        }
      }
      await sendMsg('admin_sys', app.student_id, msgHtml(
        `❌ 荣誉申请未通过`,
        `您申请的「<strong>${app.cat_name}</strong>」荣誉经审核未通过。<br>
         <strong>驳回理由：</strong>${reject_reason}<br>
         如有疑问请联系辅导员或登录系统重新申请。`,
        '#ef4444'
      ));
    }

    await pool.query('COMMIT');
    res.json({ success: true, message: '审核完成' });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: e.message || '审核失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  管理员：批量通过
// ─────────────────────────────────────────────────────────────
router.put('/applications/batch-approve', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: '请选择申请单' });

  try {
    await pool.query('START TRANSACTION');
    let successCount = 0;
    for (const id of ids) {
      const [appRows] = await pool.query(
        `SELECT a.*, c.name as cat_name, c.level as cat_level
         FROM honor_applications a JOIN honor_categories c ON a.category_id=c.id
         WHERE a.id=? AND a.status='pending' FOR UPDATE`, [id]
      );
      if (appRows.length > 0) {
        const app = appRows[0];
        await pool.query('UPDATE honor_applications SET status="approved", reviewer_id=? WHERE id=?', [req.user.id, id]);
        await pool.query(
          `INSERT INTO student_honors (student_id, category_id, application_id, issue_date, issuer)
           VALUES (?, ?, ?, CURDATE(), '学校官方')`,
          [app.student_id, app.category_id, app.id]
        );
        await sendMsg('admin_sys', app.student_id, msgHtml(
          `🎉 荣誉证书已颁发！`,
          `恭喜您！「<strong>${app.cat_name}（${app.cat_level}）</strong>」荣誉已通过审核并正式颁发。`,
          '#10b981'
        ));
        successCount++;
      }
    }
    await pool.query('COMMIT');
    res.json({ success: true, message: `批量通过 ${successCount} 个申请` });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: '批量审核失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  管理员：批量驳回
// ─────────────────────────────────────────────────────────────
router.put('/applications/batch-reject', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { ids, reject_reason } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: '请选择申请单' });
  if (!reject_reason?.trim()) return res.status(400).json({ error: '请填写驳回理由' });

  try {
    await pool.query('START TRANSACTION');
    let count = 0;
    for (const id of ids) {
      const [appRows] = await pool.query(
        `SELECT a.*, c.name as cat_name, c.credit_cost
         FROM honor_applications a JOIN honor_categories c ON a.category_id=c.id
         WHERE a.id=? AND a.status='pending' FOR UPDATE`, [id]
      );
      if (appRows.length > 0) {
        const app = appRows[0];
        await pool.query(
          'UPDATE honor_applications SET status="rejected", reviewer_id=?, reject_reason=? WHERE id=?',
          [req.user.id, reject_reason, id]
        );
        if (app.credit_deducted && app.credit_cost > 0) {
          await pool.query(
            `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status)
             VALUES (?, ?, ?, ?, 'approved')`,
            [app.student_id, app.credit_cost, `「${app.cat_name}」申请被驳回，退还德育分`, req.user.id]
          );
        }
        await sendMsg('admin_sys', app.student_id, msgHtml(
          `❌ 荣誉申请未通过`,
          `您申请的「<strong>${app.cat_name}</strong>」荣誉经审核未通过。<br><strong>理由：</strong>${reject_reason}`,
          '#ef4444'
        ));
        count++;
      }
    }
    await pool.query('COMMIT');
    res.json({ success: true, message: `已驳回 ${count} 个申请` });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: '批量驳回失败' });
  }
});

// ─────────────────────────────────────────────────────────────
//  管理员：直接颁发荣誉给学生（无需申请）
// ─────────────────────────────────────────────────────────────
router.post('/grant', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { student_id, category_id, issuer, issue_date } = req.body;
  if (!student_id || !category_id) return res.status(400).json({ error: '缺少必填项' });

  try {
    const [[cat]] = await pool.query('SELECT * FROM honor_categories WHERE id=?', [category_id]);
    if (!cat) return res.status(404).json({ error: '荣誉类型不存在' });
    const [[stu]] = await pool.query('SELECT name FROM student WHERE id=?', [student_id]);

    const [r] = await pool.query(
      `INSERT INTO student_honors (student_id, category_id, issue_date, issuer)
       VALUES (?, ?, ?, ?)`,
      [student_id, category_id, issue_date || new Date().toISOString().split('T')[0], issuer || '学校官方']
    );

    await sendMsg('admin_sys', student_id, msgHtml(
      `🏅 恭喜您荣获荣誉称号！`,
      `经校方审核颁发，您已获得「<strong>${cat.name}（${cat.level}）</strong>」荣誉证书，感谢您的辛勤付出！请在个人中心查看您的荣誉档案。`,
      '#f59e0b'
    ));

    res.json({ success: true, message: `已为 ${stu?.name || student_id} 颁发荣誉`, data: { id: r.insertId } });
  } catch (e) {
    res.status(500).json({ error: '颁发荣誉失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  管理员：撤销已发放荣誉
// ─────────────────────────────────────────────────────────────
router.delete('/issued/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  try {
    const [[honor]] = await pool.query(
      `SELECT h.*, c.name AS cat_name FROM student_honors h JOIN honor_categories c ON h.category_id=c.id WHERE h.id=?`,
      [req.params.id]
    );
    if (!honor) return res.status(404).json({ error: '荣誉记录不存在' });
    await pool.query('DELETE FROM student_honors WHERE id=?', [req.params.id]);
    // 如果关联了申请，也把申请状态回滚到 pending
    if (honor.application_id) {
      await pool.query('UPDATE honor_applications SET status="pending", reviewer_id=NULL WHERE id=?', [honor.application_id]);
    }
    await sendMsg('admin_sys', honor.student_id, msgHtml(
      `⚠️ 荣誉记录已撤销`,
      `您的「<strong>${honor.cat_name}</strong>」荣誉经校方复核已被撤销，如有疑问请联系学工处。`,
      '#f59e0b'
    ));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '撤销失败: ' + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  查询：指定学生的荣誉
// ─────────────────────────────────────────────────────────────
router.get('/students/:student_id/honors', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, c.name AS category_name, c.level AS category_level, c.template_url, c.icon
       FROM student_honors h
       JOIN honor_categories c ON h.category_id = c.id
       WHERE h.student_id = ?
       ORDER BY h.issue_date DESC`,
      [req.params.student_id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: '获取学生荣誉失败' });
  }
});

// 查询：我的已发放荣誉
router.get('/honors/me', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, c.name AS category_name, c.level AS category_level, c.template_url, c.icon
       FROM student_honors h
       JOIN honor_categories c ON h.category_id = c.id
       WHERE h.student_id = ?
       ORDER BY h.issue_date DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: '获取我的荣誉失败' });
  }
});

// 查询：所有已发放荣誉（管理员）
router.get('/issued', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: '权限不足' });
  const { keyword } = req.query;
  try {
    const where = keyword ? 'WHERE h.student_id LIKE ? OR s.name LIKE ?' : '';
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];
    const [rows] = await pool.query(
      `SELECT h.*, c.name AS category_name, c.level AS category_level, c.icon,
              s.name AS student_name, s.class_name, s.college
       FROM student_honors h
       JOIN honor_categories c ON h.category_id = c.id
       LEFT JOIN student s ON h.student_id = s.id
       ${where}
       ORDER BY h.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: '获取已发放荣誉失败' });
  }
});

// 查询：德育分余额（供学生查询）
router.get('/credit-balance', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN status='approved' THEN credit_change ELSE 0 END), 0) AS balance
       FROM moral_credit WHERE student_id=?`,
      [req.user.id]
    );
    res.json({ success: true, balance: parseFloat(row.balance) || 0 });
  } catch (e) {
    res.status(500).json({ error: '获取德育分失败' });
  }
});

export default router;
