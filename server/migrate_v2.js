/**
 * 数据库结构升级脚本：
 * 1. 修复 message 表 (添加 sender_deleted, receiver_deleted 字段)
 * 2. 扩充 student 表 (添加个人信息相关字段: 性别、政治面貌、职务等)
 * 运行: node migrate_v2.js
 */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'sudt_db',
  charset: 'utf8mb4'
};

const run = async () => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ 已连接数据库 sudt_db');

    // ── 1. 修复 message 表：添加软删除字段 ──────────────────────
    console.log('\n🔧 修复 message 表 (添加软删除字段)...');
    
    const [msgColumns] = await conn.query(`SHOW COLUMNS FROM message LIKE 'sender_deleted'`);
    if (msgColumns.length === 0) {
      await conn.query(`ALTER TABLE message ADD COLUMN sender_deleted BOOLEAN NOT NULL DEFAULT FALSE`);
      await conn.query(`ALTER TABLE message ADD COLUMN receiver_deleted BOOLEAN NOT NULL DEFAULT FALSE`);
      await conn.query(`ALTER TABLE message ADD INDEX idx_msg_deleted (sender_deleted, receiver_deleted)`);
      console.log('  ✓ message 表添加 sender_deleted, receiver_deleted 字段完成');
    } else {
      console.log('  ⏭️  message.sender_deleted 字段已存在，跳过');
    }

    // ── 2. 扩充 student 表：添加个人信息字段 ────────────────────
    console.log('\n🔧 扩充 student 表 (添加个人详细信息字段)...');

    const fieldsToAdd = [
      { col: 'political_status', def: `ADD COLUMN political_status VARCHAR(50) DEFAULT '群众' COMMENT '政治面貌' AFTER gender` },
      { col: 'nation',           def: `ADD COLUMN nation VARCHAR(30) DEFAULT '汉族' COMMENT '民族' AFTER political_status` },
      { col: 'native_place',     def: `ADD COLUMN native_place VARCHAR(100) COMMENT '籍贯' AFTER nation` },
      { col: 'birth_date',       def: `ADD COLUMN birth_date DATE COMMENT '出生日期' AFTER native_place` },
      { col: 'position',         def: `ADD COLUMN position VARCHAR(100) COMMENT '职务/担任职务' AFTER class_name` },
      { col: 'department',       def: `ADD COLUMN department VARCHAR(100) COMMENT '所在部门(教师用)' AFTER position` },
      { col: 'title',            def: `ADD COLUMN title VARCHAR(50) COMMENT '职称(教师用)' AFTER department` },
      { col: 'work_type',        def: `ADD COLUMN work_type VARCHAR(50) COMMENT '用工类型' AFTER title` },
      { col: 'is_party_member',  def: `ADD COLUMN is_party_member TINYINT(1) DEFAULT 0 COMMENT '是否党员' AFTER work_type` },
      { col: 'family_members',   def: `ADD COLUMN family_members JSON COMMENT '家庭成员结构化数据[{name,relation,phone,work}]' AFTER resume` },
      { col: 'work_history',     def: `ADD COLUMN work_history JSON COMMENT '工作/学习履历[{start,end,org,role}]' AFTER family_members` },
      { col: 'personal_summary', def: `ADD COLUMN personal_summary TEXT COMMENT '个人综合评价' AFTER work_history` },
      { col: 'wechat',           def: `ADD COLUMN wechat VARCHAR(50) COMMENT '微信号' AFTER email` },
      { col: 'id_type',          def: `ADD COLUMN id_type VARCHAR(20) DEFAULT '居民身份证' COMMENT '证件类型' AFTER id_card` },
    ];

    for (const f of fieldsToAdd) {
      const [cols] = await conn.query(`SHOW COLUMNS FROM student LIKE ?`, [f.col]);
      if (cols.length === 0) {
        await conn.query(`ALTER TABLE student ${f.def}`);
        console.log(`  ✓ 添加 student.${f.col}`);
      } else {
        console.log(`  ⏭️  student.${f.col} 已存在，跳过`);
      }
    }

    // ── 3. 更新后端 profile 接口（server/index.js 已通过 JSON 存 family_info）
    //       但现在我们要让数据和新字段对齐，先更新几个测试学生
    console.log('\n🌱 更新测试学生数据...');
    await conn.query(`
      UPDATE student SET
        political_status = '共青团员',
        nation           = '汉族',
        native_place     = '黑龙江省哈尔滨市',
        birth_date       = '2003-01-15',
        position         = '班长',
        family_members   = '[{"name":"张国强","relation":"父亲","phone":"13900001111","work":"某国企工程师"},{"name":"李秀梅","relation":"母亲","phone":"13900001112","work":"教师"}]',
        work_history     = '[{"start":"2023-09","end":"至今","org":"某某大学","role":"在校学生"}]',
        personal_summary = '本人品学兼优，积极参与学生活动，具有良好的团队合作与创新能力。'
      WHERE id = 'student_001'
    `);
    await conn.query(`
      UPDATE student SET
        political_status = '中共党员',
        nation           = '汉族',
        native_place     = '山东省济南市',
        birth_date       = '2003-12-22',
        position         = '学习委员',
        family_members   = '[{"name":"李建国","relation":"父亲","phone":"13900002221","work":"私营企业主"},{"name":"赵丽华","relation":"母亲","phone":"13900002222","work":"护士"}]',
        work_history     = '[{"start":"2023-09","end":"至今","org":"某某大学","role":"在校学生"}]',
        personal_summary = '学习刻苦，成绩优异，连续两学年综合排名全学院第一，多次获得荣誉表彰。'
      WHERE id = 'student_002'
    `);
    console.log('  ✓ 测试数据更新完成');

    console.log('\n🎉 数据库迁移完成！\n');
  } catch (err) {
    console.error('\n❌ 迁移失败:', err.message, err.sqlMessage || '');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
};

run();
