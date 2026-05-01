/**
 * 一站式学生综合服务系统 - 数据库完全重置与初始化脚本
 * 执行: node reset_db.js
 * 警告: 此脚本会删除并重建所有数据表和数据
 */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  charset: 'utf8mb4',
  multipleStatements: true
};

const DB_NAME = 'sudt_db';

const run = async () => {
  let conn;
  try {
    console.log('🔗 连接 MySQL 服务器...');
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功');

    // ── Step 1: 重建数据库 ──────────────────────────────────────
    console.log(`\n🗑️  删除并重建数据库 [${DB_NAME}]...`);
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    console.log(`✅ 数据库 [${DB_NAME}] 重建完毕`);

    // ── Step 2: 建表 ────────────────────────────────────────────
    console.log('\n📐 创建所有数据表...');

    const tables = [
      // 1. 角色表
      `CREATE TABLE user_role (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色标识',
        description VARCHAR(255) COMMENT '角色描述',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='系统角色表'`,

      // 2. 权限表
      `CREATE TABLE role_permission (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_name VARCHAR(100) NOT NULL,
        permission_type ENUM('data', 'transaction', 'message', 'other') NOT NULL,
        FOREIGN KEY (role_id) REFERENCES user_role(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='角色权限表'`,

      // 3. 学生主表
      `CREATE TABLE student (
        id VARCHAR(50) PRIMARY KEY COMMENT '登录账号/学号',
        student_no VARCHAR(50) UNIQUE NOT NULL COMMENT '学籍号',
        name VARCHAR(100) NOT NULL COMMENT '姓名',
        id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
        gender ENUM('男', '女') NOT NULL DEFAULT '男',
        enroll_year VARCHAR(10) COMMENT '入学年份',
        grad_year VARCHAR(10) COMMENT '毕业年份',
        college VARCHAR(100) COMMENT '学院',
        major VARCHAR(100) COMMENT '专业',
        class_name VARCHAR(100) COMMENT '班级',
        status ENUM('正常', '休学', '退学', '入伍', '毕业') DEFAULT '正常',
        phone VARCHAR(20),
        email VARCHAR(100),
        emergency_contact VARCHAR(255) COMMENT '紧急联系人',
        address VARCHAR(255) COMMENT '家庭住址',
        bio TEXT COMMENT '个人简介',
        avatar_url VARCHAR(255),
        family_info TEXT COMMENT '家庭成员JSON',
        resume TEXT COMMENT '个人简历JSON',
        instructor_id VARCHAR(50) COMMENT '辅导员ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='学生信息表'`,

      // 4. 家庭成员表
      `CREATE TABLE family (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50) NOT NULL COMMENT '关系',
        age INT,
        job VARCHAR(100) COMMENT '职业',
        phone VARCHAR(20),
        workplace VARCHAR(200) COMMENT '工作单位',
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='学生家庭成员表'`,

      // 5. 道德学分表
      `CREATE TABLE moral_credit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50),
        credit_change DECIMAL(5,2) NOT NULL COMMENT '变动分值',
        reason VARCHAR(255) NOT NULL,
        operated_by VARCHAR(50) COMMENT '操作人',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='道德信用记录表'`,

      // 6. 主申请事务表
      `CREATE TABLE apply (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apply_type VARCHAR(100) NOT NULL COMMENT '事务类型',
        applicant_id VARCHAR(50) NOT NULL COMMENT '申请人ID',
        content TEXT NOT NULL COMMENT '申请内容',
        form_data JSON COMMENT '表单结构化数据',
        attachments TEXT COMMENT '附件URL列表',
        status ENUM('pending', 'approved', 'rejected', 'more_info') DEFAULT 'pending',
        current_step INT DEFAULT 1 COMMENT '当前审批环节',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='事务申请主表'`,

      // 7. 审批日志表
      `CREATE TABLE approval_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apply_id INT NOT NULL,
        approver_id VARCHAR(50) NOT NULL,
        action ENUM('approve', 'reject', 'request_more', 'resubmit') NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apply_id) REFERENCES apply(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='审批操作日志'`,

      // 8. 公告表
      `CREATE TABLE notice (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'normal' COMMENT '公告类型',
        publisher_id VARCHAR(50) NOT NULL,
        publish_level VARCHAR(50) DEFAULT '学校' COMMENT '发布范围',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='系统公告表'`,

      // 9. 公告已读记录表
      `CREATE TABLE notice_read_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        notice_id INT NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_notice (user_id, notice_id),
        FOREIGN KEY (notice_id) REFERENCES notice(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='公告已读记录'`,

      // 10. 站内信表
      `CREATE TABLE message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id VARCHAR(50) NOT NULL,
        receiver_id VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_apply_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (related_apply_id) REFERENCES apply(id) ON DELETE SET NULL
      ) ENGINE=InnoDB COMMENT='站内消息表'`,

      // 11. 审批通知表
      `CREATE TABLE approval_notice (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apply_id INT NOT NULL,
        receiver_id VARCHAR(50) NOT NULL,
        notice_type ENUM('pending', 'approved', 'rejected', 'more_info', 'timeout') NOT NULL,
        status ENUM('unread', 'read') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apply_id) REFERENCES apply(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='审批流通知表'`,

      // 12. 学籍变动记录表
      `CREATE TABLE student_change (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        apply_id INT NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (apply_id) REFERENCES apply(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='学籍变更记录表'`,

      // 13. 系统操作日志
      `CREATE TABLE system_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50),
        action_type VARCHAR(100),
        action_detail TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='系统操作日志'`,

      // 14. 荣誉分类表
      `CREATE TABLE honor_categories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL COMMENT '级别：国家级/省部级/校级',
        template_url VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='荣誉评定分类配置'`,

      // 15. 荣誉申请表
      `CREATE TABLE honor_applications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        category_id BIGINT NOT NULL,
        proof_urls JSON NOT NULL COMMENT '佐证材料URL列表',
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        reviewer_id VARCHAR(50),
        reject_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES honor_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='学生荣誉申请表'`,

      // 16. 学生荣誉汇总表
      `CREATE TABLE student_honors (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        category_id BIGINT NOT NULL,
        application_id BIGINT,
        issue_date DATE NOT NULL,
        issuer VARCHAR(100) NOT NULL COMMENT '颁发机构',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES honor_categories(id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES honor_applications(id) ON DELETE SET NULL
      ) ENGINE=InnoDB COMMENT='学生荣誉存档'`
    ];

    for (const sql of tables) {
      await conn.query(sql);
    }

    // 创建索引
    await conn.query(`CREATE INDEX idx_apply_applicant ON apply (applicant_id, status)`);
    await conn.query(`CREATE INDEX idx_apply_step ON apply (status, current_step)`);
    await conn.query(`CREATE INDEX idx_msg_receiver ON message (receiver_id, is_read)`);
    await conn.query(`CREATE INDEX idx_notice_level ON notice (publish_level, created_at)`);
    await conn.query(`CREATE INDEX idx_honor_student_status ON honor_applications (student_id, status)`);
    await conn.query(`CREATE INDEX idx_honor_status_created ON honor_applications (status, created_at)`);

    console.log('✅ 所有数据表及索引创建完成');

    // ── Step 3: 写入种子数据 ────────────────────────────────────
    console.log('\n🌱 写入初始化种子数据...');

    // 3.1 角色数据
    await conn.query(`
      INSERT INTO user_role (role_name, description) VALUES
      ('student',        '普通学生，可提交申请与查阅个人信息'),
      ('counselor',      '辅导员，负责初步审批与学生日常管理'),
      ('college_admin',  '二级学院管理员，负责复核审批'),
      ('school_admin',   '校级管理员，负责终审'),
      ('super_admin',    '系统超级管理员，拥有全部权限'),
      ('instructor',     '学业导师，可查看学情并发送消息')
    `);
    console.log('  ✓ 角色数据写入');

    // 3.2 学生数据（5名测试学生）
    await conn.query(`
      INSERT INTO student (id, student_no, name, id_card, gender, enroll_year, grad_year, college, major, class_name, status, phone, email, emergency_contact, instructor_id) VALUES
      ('student_001', '2023010101', '张伟',         '110101200301150011', '男', '2023', '2027', '计算机学院', '软件工程',     '软工2301', '正常', '13800001111', 'zhangwei@stu.edu.cn',   '父亲 张国强 13900001111', 'fa_001'),
      ('student_002', '2023010102', '李晓梅',       '110101200312220022', '女', '2023', '2027', '计算机学院', '数据科学与大数据', '数据2301', '正常', '13800002222', 'lixiaomei@stu.edu.cn', '母亲 赵丽华 13900002222', 'fa_001'),
      ('student_003', '2022020201', '王鹏',         '110102200208180033', '男', '2022', '2026', '经济管理学院', '会计学',     '会计2201', '正常', '13800003333', 'wangpeng@stu.edu.cn',   '父亲 王建国 13900003333', 'fa_002'),
      ('student_004', '2022020202', '陈思雨',       '110103200105090044', '女', '2022', '2026', '经济管理学院', '工商管理',   '工管2202', '休学', '13800004444', 'chensiy@stu.edu.cn',    '母亲 陈凤英 13900004444', 'fa_002'),
      ('student_005', '2021030301', '刘杨',         '110104200007220055', '男', '2021', '2025', '外国语学院',  '英语',         '英语2101', '正常', '13800005555', 'liuyang@stu.edu.cn',     '父亲 刘建军 13900005555', 'fa_003')
    `);
    console.log('  ✓ 学生基础数据写入（5名学生）');

    // 3.3 公告数据
    await conn.query(`
      INSERT INTO notice (title, content, type, publisher_id, publish_level) VALUES
      ('关于2025年度国家奖学金申报工作的通知', '<p>根据教育部和省教育厅相关文件要求，现就我校2025年度国家奖学金申报工作通知如下：</p><p>一、申报条件：全日制在校本科生，综合测评成绩位年级前5%，无违纪记录。</p><p>二、申报时间：即日起至2025年10月15日。</p><p>三、申报材料：请登录系统提交电子版申请表及相关佐证材料。</p><p>请各学院认真组织，按时完成申报工作。</p>', 'important', 'admin_sys', '学校'),
      ('2025-2026学年第一学期期末考试安排公告', '<p>本学期期末考试定于2026年1月6日至1月17日举行，请全体同学注意以下事项：</p><ul><li>考试期间请携带有效证件入场</li><li>考场内禁止携带电子设备</li><li>成绩查询将于2月1日开放</li></ul><p>如有问题请联系所在学院教务员。</p>', 'normal', 'admin_sys', '学校'),
      ('关于元旦假期放假及安全的通知', '<p>根据国家法定节假日安排，2026年元旦放假1天（1月1日），与周末连休，共放假3天（12月31日至1月2日）。请同学们注意假期安全，遵守相关规定。</p>', 'normal', 'admin_sys', '学校'),
      ('计算机学院关于专业导论课程调整的公告', '<p>经学院研究决定，自下学期起对《专业导论》课程内容进行调整优化，主要增加AI技术应用实践模块，具体课程大纲请关注学院官网。</p>', 'normal', 'fa_001', '学院'),
      ('关于开展2025年度"优秀学生干部"评选活动的通知', '<p>为激励广大学生积极参与学生工作，现开展2025年度优秀学生干部评选。有意参评的同学请于10月20日前通过系统提交申请，评选结果将在官网公示。</p>', 'important', 'admin_sys', '学校')
    `);
    console.log('  ✓ 系统公告写入（5条）');

    // 3.4 事务申请数据
    await conn.query(`
      INSERT INTO apply (apply_type, applicant_id, content, form_data, status, current_step) VALUES
      ('请假申请', 'student_001', '因病请假申请', '{"reason":"发烧38.5度，医院要求休息","startDate":"2026-04-08","endDate":"2026-04-09","days":2}', 'pending', 1),
      ('奖助学金申请', 'student_002', '国家励志奖学金申请', '{"scholarship_name":"国家励志奖学金","reason":"品学兼优，家庭困难","gpa":4.2}', 'pending', 2),
      ('评优评先', 'student_003', '三好学生称号评定申请', '{"honor_type":"三好学生","achievements":"连续两学期综合测评第一"}', 'approved', 3),
      ('认证考试报名申请', 'student_001', '英语四级考试报名', '{"exam_name":"英语四级","exam_date":"2026-06-15","student_note":"此前已考过一次，希望提高成绩"}', 'pending', 1),
      ('休学申请', 'student_004', '因本人患病，申请休学一年', '{"reason":"重症患者，需长期治疗","duration":"一年","expected_return":"2026-09"}', 'approved', 3),
      ('复学申请', 'student_005', '休学期满申请复学', '{"reason":"病情已康复，体检合格，申请复学","certificate_url":""}', 'pending', 1)
    `);
    console.log('  ✓ 事务申请写入（6条）');

    // 3.5 审批日志数据
    await conn.query(`
      INSERT INTO approval_log (apply_id, approver_id, action, comment) VALUES
      (2, 'fa_001', 'approve', '初审通过，同学表现优异，家庭情况属实'),
      (3, 'fa_002', 'approve', '同意，该同学符合评优条件'),
      (3, 'college_001', 'approve', '院级复审通过'),
      (3, 'admin_sys', 'approve', '校级终审通过，恭喜该同学'),
      (5, 'fa_001', 'approve', '情况属实，同意初审'),
      (5, 'college_001', 'approve', '复审同意'),
      (5, 'admin_sys', 'approve', '批准休学一年，注意保留学籍')
    `);
    console.log('  ✓ 审批日志写入');

    // 3.6 站内消息
    await conn.query(`
      INSERT INTO message (sender_id, receiver_id, content) VALUES
      ('admin_sys', 'student_001', '<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;"><h4 style="margin:0 0 10px 0;color:#1e293b;">欢迎使用一站式学生综合服务系统！</h4><p style="color:#475569;">亲爱的同学，您已成功注册本系统。在这里您可以查询学籍信息、提交各类申请、接收通知消息。如有疑问请联系辅导员或学工处。祝学习生活愉快！</p></div>'),
      ('fa_001',    'student_001', '<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;"><h4 style="margin:0 0 10px 0;color:#1e293b;">关于期末考试的提醒</h4><p style="color:#475569;">张伟同学，期末考试即将到来，请注意合理安排复习时间。如有学业上的问题，欢迎来办公室找我交流。</p></div>'),
      ('admin_sys', 'student_002', '<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;"><h4 style="margin:0 0 10px 0;color:#1e293b;">系统自动通知：事务审批进度更新</h4><p style="color:#475569;">您提交的<strong>奖助学金申请</strong>已通过初审，流转至院级复审环节。</p></div>'),
      ('fa_001',    'student_002', '<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;"><h4 style="margin:0 0 10px 0;color:#1e293b;">奖学金申请进展</h4><p style="color:#475569;">李晓梅同学，你的国家励志奖学金申请表材料齐全，已流转到院级审核，静待结果即可。</p></div>'),
      ('admin_sys', 'student_003', '<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;"><h4 style="margin:0 0 10px 0;color:#1e293b;">恭喜！评优评先结果通知</h4><p style="color:#475569;">王鹏同学，您申请的<strong>三好学生</strong>称号已通过校级终审，恭喜您！荣誉证书将在颁奖典礼上颁发。</p></div>')
    `);
    console.log('  ✓ 站内消息写入（5条）');

    // 3.7 荣誉分类
    await conn.query(`
      INSERT INTO honor_categories (id, name, level, template_url) VALUES
      (1,  '国家奖学金',              '国家级', '/assets/honors/national_scholarship.png'),
      (2,  '国家励志奖学金',          '国家级', '/assets/honors/national_encourage.png'),
      (3,  '全国职业院校技能大赛一等奖', '国家级', '/assets/honors/skills_competition.png'),
      (4,  '省级三好学生',            '省部级', '/assets/honors/provincial_good_student.png'),
      (5,  '省级优秀学生干部',        '省部级', '/assets/honors/provincial_cadre.png'),
      (6,  '省部级科技竞赛一等奖',    '省部级', '/assets/honors/provincial_tech.png'),
      (7,  '优秀学生干部',            '校级',   '/assets/honors/excellent_cadre.png'),
      (8,  '三好学生',                '校级',   '/assets/honors/good_student.png'),
      (9,  '校级一等奖学金',          '校级',   '/assets/honors/school_scholarship_1.png'),
      (10, '校级科技创新一等奖',      '校级',   '/assets/honors/school_innovation.png')
    `);
    console.log('  ✓ 荣誉分类写入（10类）');

    // 3.8 荣誉申请与存档
    await conn.query(`
      INSERT INTO honor_applications (student_id, category_id, proof_urls, description, status, reviewer_id) VALUES
      ('student_002', 1, '["http://localhost:3000/uploads/proof1.pdf"]', '本学年综合成绩全院第一，GPA4.5，积极参与学术竞赛', 'approved', 'admin_sys'),
      ('student_003', 8, '["http://localhost:3000/uploads/proof2.pdf"]', '连续两学期综合测评第一，积极参与学生活动', 'approved', 'college_001'),
      ('student_001', 9, '["http://localhost:3000/uploads/proof3.pdf"]', '本学年学业成绩优秀，GPA3.9', 'pending', null)
    `);

    await conn.query(`
      INSERT INTO student_honors (student_id, category_id, application_id, issue_date, issuer) VALUES
      ('student_002', 1, 1, '2025-12-15', '教育部全国学生资助管理中心'),
      ('student_003', 8, 2, '2025-11-20', '某某大学学工处')
    `);
    console.log('  ✓ 荣誉数据写入');

    // 3.9 道德积分示例
    await conn.query(`
      INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status) VALUES
      ('student_001', 2.0,  '参加志愿服务活动—寒假支教',   'fa_001', 'approved'),
      ('student_002', 3.0,  '获得国家奖学金',               'admin_sys', 'approved'),
      ('student_003', 1.5,  '担任学生干部表现优秀',         'fa_002', 'approved'),
      ('student_001', -1.0, '课堂迟到三次，违反纪律',       'fa_001', 'approved'),
      ('student_005', 2.0,  '获得英语演讲大赛校级二等奖',   'fa_003', 'approved')
    `);
    console.log('  ✓ 道德积分记录写入');

    console.log('\n🎉 数据库重置完成！所有数据已成功初始化。');
    console.log('📊 数据摘要:');
    console.log('   - 角色: 6 条');
    console.log('   - 学生: 5 名');
    console.log('   - 系统公告: 5 条');
    console.log('   - 事务申请: 6 条');
    console.log('   - 站内消息: 5 条');
    console.log('   - 荣誉分类: 10 类');
    console.log('   - 荣誉记录: 2 条');
    console.log('   - 道德积分: 5 条\n');

  } catch (err) {
    console.error('\n❌ 数据库重置失败:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
};

run();
