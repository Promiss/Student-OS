import mysql from 'mysql2/promise';
import dbConfig from './db.js'; // Actually db.js exports pool. Let's just require it or use the pool.

const initializeHonorsDB = async () => {
  let connection;
  try {
    console.log('Connecting to MySQL server...');
// Online Database Configuration (Commented out for now, to be restored later)
    // connection = await mysql.createConnection({
    //   host: '49.232.58.170',
    //   port: 3306,
    //   user: 'root',
    //   password: '70c3667ee5edef98',
    //   database: 'sudt_db'
    // });

    // Local Database Configuration
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'sudt_db',
      charset: 'utf8mb4'
    });
    console.log('Connected successfully.');

    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS honor_categories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL,
        template_url VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS honor_applications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        category_id BIGINT NOT NULL,
        proof_urls JSON NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        reviewer_id VARCHAR(50),
        reject_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES honor_categories(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS student_honors (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        category_id BIGINT NOT NULL,
        application_id BIGINT,
        issue_date DATE NOT NULL,
        issuer VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES honor_categories(id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES honor_applications(id) ON DELETE SET NULL
      )`
    ];

    for (let query of tableQueries) {
      await connection.query(query);
    }

    // Create Indexes
    await connection.query(`CREATE INDEX idx_student_status ON honor_applications (student_id, status)`);
    await connection.query(`CREATE INDEX idx_status_created ON honor_applications (status, created_at)`);
    await connection.query(`CREATE INDEX idx_student_issue ON student_honors (student_id, issue_date DESC)`);

    console.log('Honor tables created successfully.');
    
    // Insert some default categories
    await connection.query(`INSERT IGNORE INTO honor_categories (id, name, level, template_url) VALUES 
      (1, '国家奖学金', '国家级', '/assets/honors/national_scholarship.png'),
      (2, '全国职业院校技能大赛一等奖', '国家级', '/assets/honors/skills_competition.png'),
      (3, '优秀学生干部', '校级', '/assets/honors/excellent_cadre.png'),
      (4, '省级三好学生', '省部级', '/assets/honors/provincial_good_student.png')
    `);

  } catch (error) {
    // ignore duplicate index errors
    if (error.code !== 'ER_DUP_KEYNAME') {
        console.error('Database initialization error:', error);
    } else {
        console.log('Indexes already exist.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
    console.log('Initialization process finished.');
  }
};

initializeHonorsDB();
