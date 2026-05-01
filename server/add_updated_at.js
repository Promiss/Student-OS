import pool from './db.js';
async function updateDb() {
  try {
    await pool.query('ALTER TABLE notice ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    console.log('updated_at column added successfully');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
updateDb();