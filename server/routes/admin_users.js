import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const router = express.Router();

// 权限检查：只有管理员角色才能访问用户管理功能
const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  const adminRoles = ['super_admin', 'school_admin', 'college_admin', 'counselor', 'jw_admin'];
  if (!adminRoles.includes(role)) {
    return res.status(403).json({ error: '权限不足，仅管理员可操作用户管理功能' });
  }
  next();
};

// 权限检查：只有超管和学工管理员能进行敏感操作（删除、重置密码）
const requireSuperOrSchoolAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (!['super_admin', 'school_admin'].includes(role)) {
    return res.status(403).json({ error: '权限不足，需要超级管理员或学工管理员权限' });
  }
  next();
};

// GET /api/admin/users — 查询用户列表（分页+搜索）
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search = '', college = '', role_filter = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    // 二级学院管理员只能看本学院学生
    if (req.user.role === 'college_admin' && req.user.college) {
      whereClauses.push('s.college = ?');
      params.push(req.user.college);
    }

    if (search) {
      whereClauses.push('(s.id LIKE ? OR s.name LIKE ? OR s.student_no LIKE ? OR s.phone LIKE ?)');
      const kw = `%${search}%`;
      params.push(kw, kw, kw, kw);
    }
    if (college) {
      whereClauses.push('s.college = ?');
      params.push(college);
    }
    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM student s ${whereStr}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT s.id, s.student_no, s.name, s.gender, s.college, s.major, s.class_name, 
             s.status, s.phone, s.email, s.enroll_year, s.grad_year, s.position,
             s.department, s.title, s.work_type, s.is_party_member, s.political_status,
             s.nation, s.native_place, s.birth_date, s.address, s.bio, s.avatar_url,
             s.emergency_contact_name, s.emergency_contact_phone, s.emergency_contact,
             s.wechat, s.personal_summary,
             s.created_at, s.updated_at
      FROM student s ${whereStr} 
      ORDER BY s.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    // 推断用户角色（根据ID前缀规则）
    const inferRole = (id) => {
      if (id.startsWith('admin')) return 'super_admin';
      if (id.startsWith('su')) return 'school_admin';
      if (id.startsWith('college')) return 'college_admin';
      if (id.startsWith('fa')) return 'counselor';
      if (id.startsWith('teacher')) return 'instructor';
      return 'student';
    };

    const usersWithRole = rows.map(u => ({ ...u, role: inferRole(u.id) }));

    res.json({ success: true, users: usersWithRole, total, page: parseInt(page), pageSize: limit });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败: ' + error.message });
  }
});

// GET /api/admin/users/colleges — 获取全部学院列表（用于下拉筛选）
router.get('/colleges', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT college FROM student WHERE college IS NOT NULL AND college != "" ORDER BY college'
    );
    const colleges = rows.map(r => r.college);
    res.json({ success: true, colleges });
  } catch (error) {
    res.status(500).json({ error: '获取学院列表失败' });
  }
});

// GET /api/admin/users/:id — 获取单个用户详情
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    
    const user = rows[0];
    ['family_members', 'work_history'].forEach(f => {
      if (user[f] && typeof user[f] === 'string') {
        try { user[f] = JSON.parse(user[f]); } catch(e) { user[f] = []; }
      }
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: '获取用户详情失败: ' + error.message });
  }
});

// POST /api/admin/users — 创建单个用户
router.post('/users', requireSuperOrSchoolAdmin, async (req, res) => {
  try {
    const {
      id, student_no, name, gender = '男', id_card = '000000000000000000',
      political_status = '群众', nation = '汉族', native_place, birth_date,
      enroll_year, grad_year, college, major, class_name, status = '正常',
      position, phone, wechat, email,
      emergency_contact_name, emergency_contact_phone, emergency_contact,
      address, bio, avatar_url, department, title, work_type, is_party_member = false,
      family_info, resume, personal_summary, password
    } = req.body;

    if (!id || !name) return res.status(400).json({ error: '用户ID和姓名为必填字段' });

    // 检查是否已存在
    const [existing] = await pool.query('SELECT id FROM student WHERE id = ? OR student_no = ?', [id, student_no || id]);
    if (existing.length > 0) return res.status(409).json({ error: `用户 ${id} 已存在，请勿重复创建` });

    // 哈希密码（如果提供）
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await pool.query(
      `INSERT INTO student (id, student_no, name, id_card, gender, political_status, nation, native_place, birth_date,
         enroll_year, grad_year, college, major, class_name, status, position,
         phone, wechat, email, emergency_contact_name, emergency_contact_phone, emergency_contact,
         address, bio, avatar_url, department, title, work_type, is_party_member,
         family_info, resume, personal_summary, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, student_no || id, name, id_card, gender,
        political_status, nation, native_place || null, birth_date || null,
        enroll_year || null, grad_year || null,
        college || null, major || null, class_name || null, status, position || null,
        phone || null, wechat || null, email || null,
        emergency_contact_name || null, emergency_contact_phone || null, emergency_contact || null,
        address || null, bio || null, avatar_url || null,
        department || null, title || null, work_type || null, is_party_member ? 1 : 0,
        family_info || null, resume || null, personal_summary || null, passwordHash
      ]
    );

    res.json({ success: true, message: `用户 ${name}（${id}）创建成功` });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: '创建用户失败: ' + (error.sqlMessage || error.message) });
  }
});

// POST /api/admin/users/import — 批量导入用户
router.post('/users/import', requireSuperOrSchoolAdmin, async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: '请提供有效的用户数组' });
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (const userData of users) {
    try {
      const {
        id, student_no, name, gender = '男', id_card = '000000000000000000',
        political_status = '群众', nation = '汉族', native_place, birth_date,
        enroll_year, grad_year, college, major, class_name, status = '正常',
        position, phone, wechat, email,
        emergency_contact_name, emergency_contact_phone, emergency_contact,
        address, bio, avatar_url, department, title, work_type, is_party_member = false,
        family_info, resume, personal_summary, password
      } = userData;

      if (!id || !name) {
        results.failed++;
        results.errors.push({ id: id || '未知', reason: '用户ID和姓名为必填字段' });
        continue;
      }

      // 检查是否已存在，若存在则跳过
      const [existing] = await pool.query('SELECT id FROM student WHERE id = ?', [id]);
      if (existing.length > 0) {
        results.failed++;
        results.errors.push({ id, reason: '用户已存在，已跳过' });
        continue;
      }

      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      await pool.query(
        `INSERT INTO student (id, student_no, name, id_card, gender, political_status, nation, native_place, birth_date,
           enroll_year, grad_year, college, major, class_name, status, position,
           phone, wechat, email, emergency_contact_name, emergency_contact_phone, emergency_contact,
           address, bio, avatar_url, department, title, work_type, is_party_member,
           family_info, resume, personal_summary, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, student_no || id, name, id_card, gender,
          political_status, nation, native_place || null, birth_date || null,
          enroll_year || null, grad_year || null,
          college || null, major || null, class_name || null, status, position || null,
          phone || null, wechat || null, email || null,
          emergency_contact_name || null, emergency_contact_phone || null, emergency_contact || null,
          address || null, bio || null, avatar_url || null,
          department || null, title || null, work_type || null, is_party_member ? 1 : 0,
          family_info || null, resume || null, personal_summary || null, passwordHash
        ]
      );
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ id: userData.id || '未知', reason: err.sqlMessage || err.message });
    }
  }

  res.json({
    success: true,
    message: `批量导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
    results
  });
});

// PUT /api/admin/users/:id — 编辑用户信息
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const [existing] = await pool.query('SELECT id FROM student WHERE id = ?', [userId]);
    if (existing.length === 0) return res.status(404).json({ error: '用户不存在' });

    const {
      name, student_no, gender, id_card, political_status, nation, native_place, birth_date,
      enroll_year, grad_year, college, major, class_name, status, position,
      phone, wechat, email,
      emergency_contact_name, emergency_contact_phone, emergency_contact,
      address, bio, avatar_url, department, title, work_type, is_party_member,
      family_info, resume, personal_summary
    } = req.body;

    // 二级学院管理员只能编辑基础信息
    const canEditAll = ['super_admin', 'school_admin'].includes(req.user.role);

    const setClauses = [];
    const params = [];

    const addField = (col, val) => {
      if (val !== undefined) { setClauses.push(`${col} = ?`); params.push(val ?? null); }
    };

    // 管理员可以修改所有字段
    if (canEditAll) {
      addField('name', name);
      addField('student_no', student_no);
      addField('gender', gender);
      addField('id_card', id_card);
      addField('political_status', political_status);
      addField('nation', nation);
      addField('native_place', native_place);
      addField('birth_date', birth_date);
      addField('enroll_year', enroll_year);
      addField('grad_year', grad_year);
      addField('college', college);
      addField('major', major);
      addField('class_name', class_name);
      addField('status', status);
      addField('position', position);
      addField('department', department);
      addField('title', title);
      addField('work_type', work_type);
      if (is_party_member !== undefined) {
        setClauses.push('is_party_member = ?');
        params.push(is_party_member ? 1 : 0);
      }
    }

    // 所有管理员都可以编辑的字段
    addField('phone', phone);
    addField('wechat', wechat);
    addField('email', email);
    addField('emergency_contact_name', emergency_contact_name);
    addField('emergency_contact_phone', emergency_contact_phone);
    addField('emergency_contact', emergency_contact);
    addField('address', address);
    addField('bio', bio);
    addField('avatar_url', avatar_url);
    addField('family_info', family_info);
    addField('resume', resume);
    addField('personal_summary', personal_summary);

    if (setClauses.length === 0) return res.json({ success: true, message: '没有可更新的字段' });
    params.push(userId);

    await pool.query(`UPDATE student SET ${setClauses.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: `用户 ${userId} 信息更新成功` });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用户信息失败: ' + (error.sqlMessage || error.message) });
  }
});

// PUT /api/admin/users/:id/password — 重置用户密码
router.put('/users/:id/password', requireSuperOrSchoolAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: '新密码长度至少为6位' });
    }

    const [existing] = await pool.query('SELECT id FROM student WHERE id = ?', [userId]);
    if (existing.length === 0) return res.status(404).json({ error: '用户不存在' });

    const passwordHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE student SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

    // 记录操作日志
    await pool.query(
      'INSERT INTO system_log (user_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'reset_password', `Admin ${req.user.id} reset password for user ${userId}`, req.ip]
    );

    res.json({ success: true, message: `用户 ${userId} 密码已重置成功` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: '密码重置失败: ' + error.message });
  }
});

// DELETE /api/admin/users/:id — 删除用户
router.delete('/users/:id', requireSuperOrSchoolAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 不允许删除自己
    if (userId === req.user.id) return res.status(400).json({ error: '不可删除当前登录账户' });

    const [existing] = await pool.query('SELECT id, name FROM student WHERE id = ?', [userId]);
    if (existing.length === 0) return res.status(404).json({ error: '用户不存在' });

    await pool.query('DELETE FROM student WHERE id = ?', [userId]);

    // 记录操作日志
    await pool.query(
      'INSERT INTO system_log (user_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'delete_user', `Admin ${req.user.id} deleted user ${userId} (${existing[0].name})`, req.ip]
    );

    res.json({ success: true, message: `用户 ${existing[0].name}（${userId}）已删除` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '删除用户失败: ' + error.message });
  }
});

export default router;
