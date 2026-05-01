import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all notices with read status for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`
      SELECT n.*, 
             IF(r.id IS NOT NULL, 1, 0) as is_read 
      FROM notice n 
      LEFT JOIN notice_read_log r ON n.id = r.notice_id AND r.user_id = ?
      ORDER BY n.created_at DESC
    `, [userId]);
    
    // MySQL returns 1/0 for boolean in IF, map it to true/false explicitly
    const notices = rows.map(row => ({
      ...row,
      is_read: Boolean(row.is_read)
    }));

    res.json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    res.status(500).json({ error: '获取系统公告失败' });
  }
});

// Mark a notice as read for current user
router.post('/:id/read', async (req, res) => {
  try {
    const noticeId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      'INSERT IGNORE INTO notice_read_log (user_id, notice_id) VALUES (?, ?)',
      [userId, noticeId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notice read error:', error);
    res.status(500).json({ error: '标记已读异常' });
  }
});

// Create a new notice (Admin only)
router.post('/', async (req, res) => {
  try {
    const { title, content, type, publish_level } = req.body;
    const creator_id = req.user.id;

    if (req.user.role === 'student') {
      return res.status(403).json({ error: '无权限发布公告' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: '标题与内容不能为空' });
    }

    await pool.query(
      'INSERT INTO notice (title, content, type, publisher_id, publish_level) VALUES (?, ?, ?, ?, ?)',
      [title, content, type || 'normal', creator_id, publish_level || '教务处']
    );

    res.json({ success: true, message: '公告发布成功' });
  } catch (error) {
    console.error('Submit notice error:', error);
    res.status(500).json({ error: '服务器发布公告异常' });
  }
});

// Update a notice
router.put('/:id', async (req, res) => {
  try {
    const { title, content, type, publish_level } = req.body;
    const noticeId = req.params.id;

    if (req.user.role === 'student') {
      return res.status(403).json({ error: '无权限修改公告' });
    }

    // 更新公告信息，updated_at会由数据库自动刷新
    await pool.query(
      'UPDATE notice SET title = ?, content = ?, type = ?, publish_level = ? WHERE id = ?',
      [title, content, type, publish_level, noticeId]
    );

    // 【重要逻辑】一旦管理员修改了公告，就清除它的所有已读记录，让它对所有人重新变成“未读/最新”状态
    await pool.query('DELETE FROM notice_read_log WHERE notice_id = ?', [noticeId]);

    res.json({ success: true, message: '公告更新成功，已为所有用户重置为最新状态' });
  } catch (error) {
    res.status(500).json({ error: '更新公告异常' });
  }
});

// Delete a notice
router.delete('/:id', async (req, res) => {
  try {
    const noticeId = req.params.id;

    if (req.user.role === 'student') {
      return res.status(403).json({ error: '无权限删除公告' });
    }

    await pool.query('DELETE FROM notice WHERE id = ?', [noticeId]);
    res.json({ success: true, message: '公告删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除公告异常' });
  }
});

export default router;