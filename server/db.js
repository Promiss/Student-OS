import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Online Database Configuration (Commented out for now, to be restored later)
// const pool = mysql.createPool({
//   host: '49.232.58.170',
//   port: 3306,
//   user: 'root',
//   password: '70c3667ee5edef98',
//   database: 'sudt_db',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// Local Database Configuration
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'sudt_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
