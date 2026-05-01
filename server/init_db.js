import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Connection configuration
// Online Database Configuration (Commented out for now, to be restored later)
// const dbConfig = {
//   host: '49.232.58.170',
//   port: 3306,
//   user: 'root',
//   password: '70c3667ee5edef98'
// };

// Local Database Configuration
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  charset: 'utf8mb4'
};

const DB_NAME = 'sudt_db';

const initializeDB = async () => {
  let connection;
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully.');

    // Create database if not exists
    console.log(`Creating database ${DB_NAME} if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Switch to the new database
    await connection.query(`USE \`${DB_NAME}\``);
    console.log(`Switched to database ${DB_NAME}.`);

    // Create Tables sequentially
    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS user_role (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS role_permission (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_name VARCHAR(100) NOT NULL,
        permission_type ENUM('data', 'transaction', 'message', 'other') NOT NULL,
        FOREIGN KEY (role_id) REFERENCES user_role(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS student (
        id VARCHAR(50) PRIMARY KEY,
        student_no VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        id_card VARCHAR(18) NOT NULL,
        gender ENUM('男', '女') NOT NULL,
        enroll_year VARCHAR(10),
        grad_year VARCHAR(10),
        college VARCHAR(100),
        major VARCHAR(100),
        class_name VARCHAR(100),
        status ENUM('正常', '休学', '退学', '入伍', '毕业') DEFAULT '正常',
        phone VARCHAR(20),
        email VARCHAR(100),
        emergency_contact VARCHAR(255),
        address VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(255),
        instructor_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS family (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        age INT,
        job VARCHAR(100),
        phone VARCHAR(20),
        workplace VARCHAR(200),
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS moral_credit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50),
        credit_change DECIMAL(5,2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        operated_by VARCHAR(50),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS apply (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apply_type VARCHAR(100) NOT NULL,
        applicant_id VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'more_info') DEFAULT 'pending',
        current_step INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS approval_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apply_id INT NOT NULL,
        approver_id VARCHAR(50) NOT NULL,
        action ENUM('approve', 'reject', 'request_more') NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apply_id) REFERENCES apply(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS notice (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        publisher_id VARCHAR(50) NOT NULL,
        publish_level ENUM('school', 'college', 'class') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id VARCHAR(50) NOT NULL,
        receiver_id VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_apply_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (related_apply_id) REFERENCES apply(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS approval_notice (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apply_id INT NOT NULL,
        receiver_id VARCHAR(50) NOT NULL,
        notice_type ENUM('pending', 'approved', 'rejected', 'more_info', 'timeout') NOT NULL,
        status ENUM('unread', 'read') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apply_id) REFERENCES apply(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS student_change (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        apply_id INT NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (apply_id) REFERENCES apply(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS system_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50),
        action_type VARCHAR(100),
        action_detail TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (let query of tableQueries) {
      await connection.query(query);
    }
    
    console.log('All core tables created successfully.');

  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    console.log('Initialization process finished.');
  }
};

initializeDB();
