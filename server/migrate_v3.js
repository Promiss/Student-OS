/**
 * 数据库迁移 V3
 * 1. student 表：紧急联系人拆分为 name + phone 两字段
 * 2. honor_categories 表：添加描述、图标、德育分扣除配置
 * 3. honor_applications 表：添加德育分已扣标记
 * 运行: node migrate_v3.js
 */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: '127.0.0.1', port: 3306, user: 'root',
  password: '123456', database: 'sudt_db', charset: 'utf8mb4'
};

const addColumnIfNotExists = async (conn, table, col, def) => {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [col]);
  if (rows.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ${def}`);
    console.log(`  ✓ ${table}.${col} 已添加`);
  } else {
    console.log(`  ⏭  ${table}.${col} 已存在，跳过`);
  }
};

const run = async () => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ 已连接数据库\n');

    // ── 1. student 表：紧急联系人拆分 ────────────────────────────
    console.log('🔧 [1] 扩充 student 表...');
    await addColumnIfNotExists(conn, 'student', 'emergency_contact_name',
      `ADD COLUMN emergency_contact_name VARCHAR(50) COMMENT '紧急联系人姓名' AFTER emergency_contact`);
    await addColumnIfNotExists(conn, 'student', 'emergency_contact_phone',
      `ADD COLUMN emergency_contact_phone VARCHAR(20) COMMENT '紧急联系人电话' AFTER emergency_contact_name`);

    // 迁移旧数据：从 emergency_contact (格式: "姓名 电话") 中解析
    const [students] = await conn.query(
      `SELECT id, emergency_contact FROM student WHERE emergency_contact IS NOT NULL 
       AND emergency_contact_name IS NULL AND emergency_contact != ''`
    );
    for (const s of students) {
      const parts = s.emergency_contact.split(/\s+/);
      if (parts.length >= 2) {
        const phone = parts[parts.length - 1];
        const name = parts.slice(0, -1).join(' ');
        await conn.query(
          'UPDATE student SET emergency_contact_name=?, emergency_contact_phone=? WHERE id=?',
          [name, phone, s.id]
        );
      }
    }
    if (students.length > 0) console.log(`  ✓ 迁移了 ${students.length} 条旧紧急联系人数据`);

    // ── 2. honor_categories 表：扩充 ─────────────────────────────
    console.log('\n🔧 [2] 扩充 honor_categories 表...');
    await addColumnIfNotExists(conn, 'honor_categories', 'description',
      `ADD COLUMN description TEXT COMMENT '荣誉类型说明' AFTER template_url`);
    await addColumnIfNotExists(conn, 'honor_categories', 'icon',
      `ADD COLUMN icon VARCHAR(20) DEFAULT '🏅' COMMENT '荣誉图标' AFTER description`);
    await addColumnIfNotExists(conn, 'honor_categories', 'require_credit_deduction',
      `ADD COLUMN require_credit_deduction TINYINT(1) DEFAULT 0 COMMENT '是否需扣德育分' AFTER icon`);
    await addColumnIfNotExists(conn, 'honor_categories', 'credit_cost',
      `ADD COLUMN credit_cost DECIMAL(5,2) DEFAULT 0 COMMENT '申请所需德育分' AFTER require_credit_deduction`);
    await addColumnIfNotExists(conn, 'honor_categories', 'sort_order',
      `ADD COLUMN sort_order INT DEFAULT 0 COMMENT '排序' AFTER credit_cost`);

    // 更新已有荣誉类别的描述和图标
    const catUpdates = [
      { id: 1, icon: '🏆', desc: '表彰品学兼优、成绩突出、家庭困难的优秀学生，每生每年最高8000元。', require: 0, cost: 0 },
      { id: 2, icon: '🌟', desc: '面向品学兼优、勤奋自强的家庭经济困难学生，每生每年最高5000元。', require: 0, cost: 0 },
      { id: 3, icon: '🥇', desc: '参加全国职业院校技能大赛，获得一等奖的团队或个人。需提供成绩单。', require: 0, cost: 0 },
      { id: 4, icon: '🌸', desc: '省级评定三好学生荣誉称号，综合成绩须在年级前10%。', require: 0, cost: 0 },
      { id: 5, icon: '🎖️', desc: '省级评定优秀学生干部，任职期间积极履责，成绩突出。', require: 0, cost: 0 },
      { id: 6, icon: '🔬', desc: '参加省部级科技竞赛获得一等奖，需提供获奖证书扫描件。', require: 0, cost: 0 },
      { id: 7, icon: '⭐', desc: '学校评定优秀学生干部，积极参与学生工作，表现突出。消耗德育积分申请加分。', require: 1, cost: 0.5 },
      { id: 8, icon: '🎓', desc: '学校评定三好学生，德智体美劳全面发展，综合测评优秀。', require: 0, cost: 0 },
      { id: 9, icon: '💰', desc: '校级一等奖学金，成绩位列年级专业前3%，无不及格科目。', require: 0, cost: 0 },
      { id: 10, icon: '💡', desc: '参加校级科技创新大赛应获一等奖，需参赛报告及成果展示。', require: 0, cost: 0 },
    ];
    for (const u of catUpdates) {
      await conn.query(
        `UPDATE honor_categories SET description=?, icon=?, require_credit_deduction=?, credit_cost=?, sort_order=? WHERE id=?`,
        [u.desc, u.icon, u.require, u.cost, u.id, u.id]
      );
    }
    console.log('  ✓ 已更新荣誉类别描述、图标和德育分配置');

    // ── 3. honor_applications 表：扩充 ───────────────────────────
    console.log('\n🔧 [3] 扩充 honor_applications 表...');
    await addColumnIfNotExists(conn, 'honor_applications', 'credit_deducted',
      `ADD COLUMN credit_deducted TINYINT(1) DEFAULT 0 COMMENT '德育分是否已扣除'`);

    // ── 4. 添加德育分余额查询视图（方便查询）
    console.log('\n🔧 [4] 重建德育分余额视图...');
    await conn.query(`DROP VIEW IF EXISTS student_credit_balance`);
    await conn.query(`
      CREATE VIEW student_credit_balance AS
      SELECT student_id,
             COALESCE(SUM(CASE WHEN status='approved' THEN credit_change ELSE 0 END), 100) AS balance,
             COUNT(*) AS record_count
      FROM moral_credit
      GROUP BY student_id
    `);
    console.log('  ✓ 德育分余额视图已创建');

    // ── 5. honor_categories 新增额度申请类型（德育分兑换）
    console.log('\n🌱 [5] 检查并补充德育积分换荣誉的类型...');
    const [existRows] = await conn.query(`SELECT id FROM honor_categories WHERE name='德育积分优秀奖' LIMIT 1`);
    if (existRows.length === 0) {
      await conn.query(`
        INSERT INTO honor_categories (name, level, description, icon, require_credit_deduction, credit_cost, status, sort_order)
        VALUES ('德育积分优秀奖','校级','德育积分达到110分即可申请，无需其他证明材料。','🌈',1,5.00,1,11)
      `);
      console.log('  ✓ 新增「德育积分优秀奖」类型');
    } else {
      console.log('  ⏭  德育积分优秀奖已存在，跳过');
    }

    console.log('\n🎉 V3 数据库迁移完成！\n');
  } catch (err) {
    console.error('\n❌ 迁移失败:', err.message, err.sqlMessage || '');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
};

run();
