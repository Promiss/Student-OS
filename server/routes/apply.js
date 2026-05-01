import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all applications for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    // Add type query param for specific views like academic affairs
    const { view_type } = req.query;

    let query = 'SELECT * FROM apply ';
    let params = [];

    if (view_type === 'academic') {
      // 教务处专属视图：只看已流转到最后的考试报名
      query += 'WHERE apply_type = "认证考试报名申请" AND current_step >= 3 ORDER BY created_at DESC';
    } else if (role === 'student') {
      query += 'WHERE applicant_id = ? ORDER BY created_at DESC';
      params.push(userId);
    } else if (role === 'super_admin') {
      query += 'ORDER BY created_at DESC';
    } else if (role === 'school_admin') {
      // 校级管理员处理最终审批 (current_step = 3)
      query += 'WHERE status = "pending" AND current_step = 3 ORDER BY created_at DESC';
    } else if (role === 'counselor') {
      // 辅导员只看初审 (current_step = 1)
      query += 'WHERE status = "pending" AND current_step = 1 ORDER BY created_at DESC';
    } else if (role === 'college_admin') {
      // 二级学院管理员看复审 (current_step = 2)
      query += 'WHERE status = "pending" AND current_step = 2 ORDER BY created_at DESC';
    } else {
      query += 'WHERE status = "pending" ORDER BY created_at DESC';
    }

    const [rows] = await pool.query(query, params);
    
    res.json({ success: true, applications: rows });

  } catch (error) {
    console.error('Fetch applies error:', error);
    res.status(500).json({ error: '数据库获取事务流转失败' });
  }
});

// Submit a new application
router.post('/', async (req, res) => {
  try {
    const { apply_type, content, form_data, attachments } = req.body;
    const applicant_id = req.user.id;

    if (!apply_type || !content) {
      return res.status(400).json({ error: '表单必须填写类型与内容' });
    }

    const [result] = await pool.query(
      'INSERT INTO apply (apply_type, applicant_id, content, status, form_data, attachments) VALUES (?, ?, ?, ?, ?, ?)',
      [apply_type, applicant_id, content, 'pending', JSON.stringify(form_data || {}), attachments || '']
    );

    res.json({
      success: true,
      message: '你的申请事务已成功提交，请等待辅导员/院系审核。',
      apply_id: result.insertId
    });
  } catch (error) {
    console.error('Submit apply error:', error);
    res.status(500).json({ error: '服务器提交事务异常' });
  }
});

// Resubmit a rejected application (Student only)
router.post('/:id/resubmit', async (req, res) => {
  try {
    const { content, form_data } = req.body;
    const applyId = req.params.id;
    const applicant_id = req.user.id;

    // Check if the application exists, belongs to the user, and is rejected
    const [rows] = await pool.query('SELECT * FROM apply WHERE id = ? AND applicant_id = ? AND status = "rejected"', [applyId, applicant_id]);
    
    if (rows.length === 0) {
      return res.status(403).json({ error: '只能重新提交被自己驳回的申请' });
    }

    // Update application status to pending and update content
    await pool.query(
      'UPDATE apply SET content = ?, form_data = ?, status = "pending" WHERE id = ?',
      [content, JSON.stringify(form_data || {}), applyId]
    );

    // Log the resubmission action
    await pool.query(
      'INSERT INTO approval_log (apply_id, approver_id, action, comment) VALUES (?, ?, ?, ?)',
      [applyId, applicant_id, 'resubmit', '申请人修改后重新提交']
    );

    res.json({ success: true, message: '申请已重新提交' });
  } catch (error) {
    console.error('Resubmit apply error:', error);
    res.status(500).json({ error: '服务器重新提交异常' });
  }
});

// Get application details with approval logs
router.get('/:id', async (req, res) => {
  try {
    const applyId = req.params.id;
    const [applies] = await pool.query('SELECT * FROM apply WHERE id = ?', [applyId]);
    if (applies.length === 0) return res.status(404).json({ error: '申请不存在' });
    
    const [logs] = await pool.query('SELECT * FROM approval_log WHERE apply_id = ? ORDER BY created_at ASC', [applyId]);
    res.json({ success: true, apply: applies[0], logs });
  } catch (error) {
    res.status(500).json({ error: '获取事务详情失败' });
  }
});

// Process an approval
router.post('/:id/approve', async (req, res) => {
  try {
    const applyId = req.params.id;
    const { action, comment } = req.body;
    const approver_id = req.user.id;
    const role = req.user.role;

    if (role === 'student') return res.status(403).json({ error: '学生无权审批' });

    // Fetch current state
    const [applyRows] = await pool.query('SELECT status, current_step, apply_type, applicant_id, form_data FROM apply WHERE id = ?', [applyId]);
    if (applyRows.length === 0) return res.status(404).json({ error: '申请不存在' });
    const applyData = applyRows[0];

    let newStatus = applyData.status;
    let newStep = applyData.current_step;

    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'more_info') {
      newStatus = 'more_info';
    } else if (action === 'approve') {
      // Logic for multi-level approval based on apply_type
      const type = applyData.apply_type;
      let formData = {};
      try {
        formData = typeof applyData.form_data === 'string' ? JSON.parse(applyData.form_data || '{}') : (applyData.form_data || {});
      } catch (e) {
        console.error('JSON parse error on form_data', e);
      }
      console.log('--- Debug Approve ---', { type, formData, currentStep: newStep });
      
      if (type === '认证考试报名申请' || type === '休学申请' || type === '复学申请' || type === '退学申请' || type === '评优评先' || type === '奖助学金申请') {
        // 3-level approval: Counselor(1) -> College Admin(2) -> School Admin(3)
        if (newStep === 1) {
          newStep = 2;
          newStatus = 'pending';
        } else if (newStep === 2) {
          newStep = 3;
          // For 认证考试报名申请, it goes to academic affairs view, but status can be 'approved' for student
          newStatus = type === '认证考试报名申请' ? 'approved' : 'pending';
        } else {
          newStatus = 'approved';
        }
      } else if (type === '请假申请') {
        // Dynamic based on days
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = (end - start) / (1000 * 60 * 60 * 24) || 1;
        
        if (newStep === 1) {
          if (days <= 3) {
            newStatus = 'approved';
          } else {
            newStep = 2;
            newStatus = 'pending';
          }
        } else if (newStep === 2) {
          if (days <= 7) {
            newStatus = 'approved';
          } else {
            newStep = 3;
            newStatus = 'pending';
          }
        } else {
          newStatus = 'approved';
        }
      } else {
        // Default 1-level or unconfigured types
        newStatus = 'approved';
      }
    }

    // Update apply status and step
    await pool.query('UPDATE apply SET status = ?, current_step = ?, updated_at = NOW() WHERE id = ?', [newStatus, newStep, applyId]);
    
    // Add log
    await pool.query(
      'INSERT INTO approval_log (apply_id, approver_id, action, comment) VALUES (?, ?, ?, ?)',
      [applyId, approver_id, action, comment]
    );

    // ---- System Notification Logic ----
    const applicantId = applyData.applicant_id;
    const applyType = applyData.apply_type;
    
    let statusText = '';
    let statusColor = '';
    
    if (action === 'approve') {
      if (newStatus === 'pending' && newStep > applyData.current_step) {
        statusText = `已通过初审，流转至下一环节 (第${newStep}步)`;
        statusColor = '#3b82f6'; // blue
      } else {
        statusText = '已全部同意通过';
        statusColor = '#10b981'; // green
      }
    } else if (action === 'reject') {
      statusText = '已被驳回';
      statusColor = '#ef4444'; // red
    } else {
      statusText = '需要补充材料';
      statusColor = '#f59e0b'; // yellow
    }
    
    const msgContent = `
      <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <h4 style="margin: 0 0 10px 0; color: #1e293b;">系统自动通知：事务审批进度更新</h4>
        <p style="margin: 5px 0; color: #475569;">您提交的 <strong>${applyType}</strong> (流水号: ${applyId}) 当前状态已更新为：<span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>。</p>
        <p style="margin: 5px 0; color: #475569;"><strong>审批人：</strong> ${approver_id}</p>
        ${comment ? `<p style="margin: 5px 0; color: #475569;"><strong>审批意见：</strong> ${comment}</p>` : ''}
        <p style="margin: 10px 0 0 0; font-size: 0.85rem; color: #94a3b8;">此消息由系统事务流转引擎自动发送，您可直接回复此信件与审批人进行沟通。</p>
      </div>
    `;

    await pool.query(
      'INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [approver_id, applicantId, msgContent]
    );

    res.json({ success: true, message: '审批操作成功' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: '审批处理失败' });
  }
});

export default router;
