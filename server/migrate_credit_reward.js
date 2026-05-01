import pool from './db.js';
try {
  await pool.query(`ALTER TABLE honor_categories ADD COLUMN IF NOT EXISTS credit_reward DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '审批通过后赠送德育积分'`);
  console.log('credit_reward column added successfully');
} catch(e) {
  if (e.code === 'ER_DUP_FIELDNAME') console.log('credit_reward column already exists - OK');
  else console.error('Migration error:', e.message);
}
process.exit(0);
