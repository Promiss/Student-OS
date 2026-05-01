// migrate_password_hash.js — 为 student 表添加 password_hash 字段（用于管理员设置密码）
import pool from './db.js';

const migrate = async () => {
  try {
    console.log('[MIGRATE] 检查 password_hash 列...');
    const [cols] = await pool.query('DESCRIBE student');
    const hasCol = cols.some(c => c.Field === 'password_hash');
    
    if (!hasCol) {
      console.log('[MIGRATE] 添加 password_hash 列...');
      await pool.query('ALTER TABLE student ADD COLUMN password_hash VARCHAR(255) NULL AFTER personal_summary');
      console.log('[MIGRATE] ✅ password_hash 列添加成功');
    } else {
      console.log('[MIGRATE] ✅ password_hash 列已存在，无需操作');
    }
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATE] ❌ 迁移失败:', err.message);
    process.exit(1);
  }
};

migrate();
