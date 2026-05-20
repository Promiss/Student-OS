import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();


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
