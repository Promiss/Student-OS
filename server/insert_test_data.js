import pool from './db.js';

const insertData = async () => {
  try {
    // 插入测试站内信
    await pool.query(
      'INSERT INTO message (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, ?)',
      ['admin', 'student', '欢迎使用学工系统！', false]
    );
    await pool.query(
      'INSERT INTO message (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, ?)',
      ['instructor', 'student', '请尽快提交本学期的奖学金申请。', false]
    );

    // 插入测试事务
    await pool.query(
      'INSERT INTO apply (apply_type, applicant_id, content, status) VALUES (?, ?, ?, ?)',
      ['请假申请', 'student', '因病需要请假两天', 'pending']
    );
    await pool.query(
      'INSERT INTO apply (apply_type, applicant_id, content, status) VALUES (?, ?, ?, ?)',
      ['评优评先', 'student', '申请三好学生称号', 'approved']
    );

    console.log('测试数据插入成功！');
  } catch (error) {
    console.error('插入测试数据失败:', error);
  } finally {
    process.exit();
  }
};

insertData();
