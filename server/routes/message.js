import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 1. 获取站内信会话列表（按联系人分组）
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取该用户参与的所有消息，并联表获取头像信息
    const query = `
      SELECT m.*, 
             s1.avatar_url AS sender_avatar,
             s2.avatar_url AS receiver_avatar
      FROM message m
      LEFT JOIN student s1 ON m.sender_id = s1.id
      LEFT JOIN student s2 ON m.receiver_id = s2.id
      WHERE (m.receiver_id = ? AND m.receiver_deleted = FALSE)
         OR (m.sender_id = ? AND m.sender_deleted = FALSE)
      ORDER BY m.created_at DESC
    `;
    const [rows] = await pool.query(query, [userId, userId]);

    // 按联系人分组
    const conversations = {};
    
    rows.forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          contact_id: otherUserId,
          latest_msg: msg,
          unread_count: 0,
          messages: []
        };
      }
      
      // 如果是收到的消息且未读，增加未读计数
      if (msg.receiver_id === userId && !msg.is_read) {
        conversations[otherUserId].unread_count++;
      }
      
      // 使用 unshift 让最新消息在数组末尾，这样前端渲染时新消息在下方
      conversations[otherUserId].messages.unshift(msg);
    });

    // 转换为数组并按最新消息时间排序
    const conversationList = Object.values(conversations).sort((a, b) => {
      return new Date(b.latest_msg.created_at) - new Date(a.latest_msg.created_at);
    });

    res.json(conversationList);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

// 1.5 获取站内信列表（保持向后兼容或特殊情况使用）
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'inbox'; // inbox (收件箱), outbox (发件箱)

    let query = '';
    let params = [];

    if (type === 'inbox') {
      // 查收件箱，且接收方未删除的
      query = 'SELECT * FROM message WHERE receiver_id = ? AND receiver_deleted = FALSE ORDER BY created_at DESC';
      params = [userId];
    } else {
      // 查发件箱，且发送方未删除的
      query = 'SELECT * FROM message WHERE sender_id = ? AND sender_deleted = FALSE ORDER BY created_at DESC';
      params = [userId];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: '获取站内信列表失败' });
  }
});

// 2. 发送新站内信（带智能账号匹配）
router.post('/', async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !content) {
      return res.status(400).json({ error: '接收方与内容不能为空' });
    }

    // 智能匹配逻辑：如果是纯汉字（尝试去 student 表找真实姓名对应的 ID）
    let actualReceiverId = receiver_id;
    let found = false;

    // 先检查是否是纯汉字（姓名匹配）
    if (/^[\u4e00-\u9fa5]+$/.test(receiver_id)) {
      const [students] = await pool.query('SELECT id FROM student WHERE name = ? LIMIT 1', [receiver_id]);
      if (students.length > 0) {
        found = true;
        actualReceiverId = students[0].id;
      }
    } else {
      // 否则按账号、学号匹配
      const [students] = await pool.query('SELECT id FROM student WHERE id = ? OR student_no = ? LIMIT 1', [receiver_id, receiver_id]);
      if (students.length > 0) {
        found = true;
        actualReceiverId = students[0].id;
      }
    }

    // 因为系统允许任意账号登录(例如 admin_001)，为了不阻断测试流程：
    // 如果在 student 表没找到，且是以 admin/su/fa/college/teacher 等系统账号格式开头的，我们也放行
    if (!found && /^(admin|su|fa|college|teacher)_/.test(receiver_id)) {
      found = true;
      actualReceiverId = receiver_id;
    }

    if (!found) {
      return res.status(404).json({ error: '未能找到该用户，请检查输入的账号、学号或姓名是否正确' });
    }

    await pool.query(
      'INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [sender_id, actualReceiverId, content]
    );

    res.json({ success: true, message: '站内信发送成功' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '服务器发送站内信异常' });
  }
});

// 3. 标记已读 (支持单条和批量)
router.post('/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body; // ids 是一个数组 [1, 2, 3]

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的请求参数' });
    }

    await pool.query(
      'UPDATE message SET is_read = TRUE WHERE receiver_id = ? AND id IN (?)',
      [userId, ids]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
});

// 4. 删除记录（逻辑删除与物理销毁）
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids, type } = req.body; // type: 'inbox' 或 'outbox'

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的请求参数' });
    }

    if (type === 'inbox') {
      // 接收方删除
      await pool.query('UPDATE message SET receiver_deleted = TRUE WHERE receiver_id = ? AND id IN (?)', [userId, ids]);
    } else {
      // 发送方删除
      await pool.query('UPDATE message SET sender_deleted = TRUE WHERE sender_id = ? AND id IN (?)', [userId, ids]);
    }

    // 清理机制：如果双方都已经删除了，那就彻底从数据库抹除这条记录
    await pool.query('DELETE FROM message WHERE sender_deleted = TRUE AND receiver_deleted = TRUE');

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: '删除站内信失败' });
  }
});

// 5. 删除整个会话记录
router.delete('/conversation', async (req, res) => {
  try {
    const userId = req.user.id;
    const { contact_id } = req.body;

    if (!contact_id) {
      return res.status(400).json({ error: '无效的请求参数' });
    }

    // 标记为删除：作为发送者
    await pool.query('UPDATE message SET sender_deleted = TRUE WHERE sender_id = ? AND receiver_id = ?', [userId, contact_id]);
    // 标记为删除：作为接收者
    await pool.query('UPDATE message SET receiver_deleted = TRUE WHERE receiver_id = ? AND sender_id = ?', [userId, contact_id]);

    // 物理清理：双方都删除的记录
    await pool.query('DELETE FROM message WHERE sender_deleted = TRUE AND receiver_deleted = TRUE');

    res.json({ success: true, message: '会话删除成功' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: '删除会话失败' });
  }
});

export default router;
