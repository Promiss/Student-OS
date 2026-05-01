import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from './db.js';
import applyRouter from './routes/apply.js';
import messageRouter from './routes/message.js'; 
import noticeRouter from './routes/notice.js'; 
import honorRouter from './routes/honor.js'; 
import moralCreditRouter from './routes/moral_credit.js';
import adminUsersRouter from './routes/admin_users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const PORT = 3000;
export const JWT_SECRET = 'sudt_super_secret_jwt_key_2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '权限不足，请先登录' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '登录态已过期或无效' });
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '请输入账号密码' });

    let roleType = 'student';
    if (username.startsWith('admin')) roleType = 'super_admin';
    else if (username.startsWith('su')) roleType = 'school_admin';
    else if (username.startsWith('college')) roleType = 'college_admin';
    else if (username.startsWith('fa')) roleType = 'counselor';
    else if (username.startsWith('teacher')) roleType = 'instructor';
    
    const token = jwt.sign({ id: username, role: roleType }, JWT_SECRET, { expiresIn: '24h' });
    
    try {
      await pool.query(
        'INSERT INTO system_log (user_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)',
        [username, 'login', `User ${username} logged in as ${roleType}`, req.ip]
      );
    } catch(e) {}

    res.json({
      success: true,
      message: '全域单点登录成功',
      token,
      user_info: { id: username, role: roleType, name: username + ' (Test User)' }
    });
  } catch (error) {
    res.status(500).json({ error: '系统服务器错误' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileFields = `
      id, student_no, name, id_card, id_type, gender, political_status, nation, native_place, birth_date,
      enroll_year, grad_year, college, major, class_name, status,
      position, department, title, work_type, is_party_member,
      phone, wechat, email,
      emergency_contact, emergency_contact_name, emergency_contact_phone,
      address, bio, avatar_url,
      family_info, resume, family_members, work_history, personal_summary,
      instructor_id, created_at, updated_at
    `;
    const [rows] = await pool.query(`SELECT ${profileFields} FROM student WHERE id = ?`, [userId]);
    let profile = rows.length > 0 ? rows[0] : {
      phone: '', email: '', emergency_contact: '', address: '', bio: '', avatar_url: '',
      name: '', college: '', class_name: '', position: ''
    };
    // Parse JSON fields
    ['family_members', 'work_history'].forEach(f => {
      if (profile[f] && typeof profile[f] === 'string') {
        try { profile[f] = JSON.parse(profile[f]); } catch(e) { profile[f] = []; }
      }
    });
    res.json({ success: true, user: { ...req.user, profile } });
  } catch (error) {
    console.error('Auth me error:', error);
    res.json({ success: true, user: req.user });
  }
});


app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isStudent = req.user.role === 'student';

    const {
      // 学生锁定字段（仅管理员可改）
      name, gender, political_status, nation, native_place, birth_date,
      college, major, class_name, position, enroll_year, grad_year,
      // 可自行修改字段
      phone, wechat, email,
      emergency_contact_name, emergency_contact_phone, emergency_contact,
      address, bio, avatar_url,
      department, title, work_type, is_party_member,
      family_info, resume, family_members, work_history, personal_summary
    } = req.body;

    // 学生不可修改的锁定字段
    const STUDENT_LOCKED = [
      'college','major','class_name','position','political_status',
      'enroll_year','grad_year','student_no','name','gender'
    ];

    const fm = family_members !== undefined ? JSON.stringify(family_members) : null;
    const wh = work_history !== undefined ? JSON.stringify(work_history) : null;

    const [rows] = await pool.query('SELECT id, student_no FROM student WHERE id = ?', [userId]);
    if (rows.length === 0) {
      // auto-create for staff/admin
      await pool.query(
        `INSERT INTO student (id, student_no, name, id_card, gender, political_status, nation, native_place, birth_date,
           enroll_year, grad_year, college, major, class_name, position,
           phone, wechat, email, emergency_contact_name, emergency_contact_phone, emergency_contact,
           address, bio, avatar_url, department, title, work_type, is_party_member,
           family_info, resume, family_members, work_history, personal_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, userId, name || userId, '000000000000000000', gender || '男',
          political_status || '群众', nation || '汉族', native_place || null, birth_date || null,
          enroll_year || null, grad_year || null,
          college || null, major || null, class_name || null, position || null,
          phone || null, wechat || null, email || null,
          emergency_contact_name || null, emergency_contact_phone || null, emergency_contact || null,
          address || null, bio || null, avatar_url || null,
          department || null, title || null, work_type || null, is_party_member ? 1 : 0,
          family_info || null, resume || null, fm, wh, personal_summary || null
        ]
      );
    } else {
      // 构建更新 SQL，学生锁定字段不更新
      const setClauses = [];
      const setParams = [];

      const addField = (col, val, locked = false) => {
        if (locked && isStudent) return; // 学生跳过锁定字段
        if (val !== undefined) { setClauses.push(`${col} = ?`); setParams.push(val ?? null); }
      };
      const addCoalesce = (col, val, locked = false) => {
        if (locked && isStudent) return;
        if (val !== undefined && val !== null) { setClauses.push(`${col} = COALESCE(?, ${col})`); setParams.push(val); }
      };

      // 锁定字段（学生不可改）
      addCoalesce('name',             name,             true);
      addCoalesce('gender',           gender,           true);
      addCoalesce('political_status', political_status, true);
      addCoalesce('college',          college,          true);
      addCoalesce('major',            major,            true);
      addCoalesce('class_name',       class_name,       true);
      addCoalesce('position',         position,         true);
      addCoalesce('enroll_year',      enroll_year,      true);
      addCoalesce('grad_year',        grad_year,        true);

      // 通用可编辑字段
      addCoalesce('nation',       nation);
      addCoalesce('native_place', native_place);
      addCoalesce('birth_date',   birth_date);
      addField('phone',                   phone);
      addField('wechat',                  wechat);
      addField('email',                   email);
      addField('emergency_contact_name',  emergency_contact_name);
      addField('emergency_contact_phone', emergency_contact_phone);
      addField('emergency_contact',       emergency_contact);
      addField('address',                 address);
      addField('bio',                     bio);
      addField('avatar_url',              avatar_url);
      addField('personal_summary',        personal_summary);
      addField('family_info',             family_info);
      addField('resume',                  resume);
      if (fm !== null) { setClauses.push('family_members = ?'); setParams.push(fm); }
      if (wh !== null) { setClauses.push('work_history = ?'); setParams.push(wh); }

      // 教师专属字段
      if (!isStudent) {
        addField('department', department);
        addField('title',      title);
        addField('work_type',  work_type);
        if (is_party_member !== undefined) {
          setClauses.push('is_party_member = ?'); setParams.push(is_party_member ? 1 : 0);
        }
      }

      if (setClauses.length === 0) return res.json({ success: true, message: '没有可更新的字段' });
      setParams.push(userId);
      await pool.query(`UPDATE student SET ${setClauses.join(', ')} WHERE id = ?`, setParams);
    }
    res.json({ success: true, message: '个人信息更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '更新个人信息失败: ' + (error.sqlMessage || error.message) });
  }
});




app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有文件上传' });
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// Use routes
app.use('/api/apply', authenticateToken, applyRouter);
app.use('/api/message', authenticateToken, messageRouter);
app.use('/api/notice', authenticateToken, noticeRouter);
app.use('/api/honor', authenticateToken, honorRouter);
app.use('/api/credit', authenticateToken, moralCreditRouter);
app.use('/api/admin', authenticateToken, adminUsersRouter);

app.listen(PORT, () => {
  console.log(`Backend Server API is running on http://localhost:${PORT}`);
});
