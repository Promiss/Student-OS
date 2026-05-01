import pool from './db.js';

async function migrate() {
  try {
    // Add activity_type column to moral_credit
    await pool.query(`ALTER TABLE moral_credit ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50) DEFAULT 'manual' COMMENT '来源类型'`);
    console.log('✅ activity_type column added to moral_credit');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  activity_type column already exists');
    } else {
      console.log('Column add result:', e.message);
    }
  }

  // Add test users if not exist
  const testUsers = [
    ['admin_001', 'ADMIN001', '超级管理员', '110101199001010001', '男', '中共党员', '汉族', '北京市', '1990-01-01', null, null, null, null, null, '正常', '系统管理员', '13800000001', 'admin001@school.edu.cn', null, null, null],
    ['su_001',    'SU001',    '王志远',     '110101198801020002', '男', '中共党员', '汉族', '北京市', '1988-01-02', null, null, null, null, null, '正常', '校长助理', '13800000002', 'su001@school.edu.cn', null, null, null],
    ['college_001','COL001',  '张海燕',     '110101198501030003', '女', '中共党员', '汉族', '上海市', '1985-01-03', null, null, '计算机学院', null, null, '正常', '院长', '13800000003', 'college001@school.edu.cn', null, null, null],
    ['fa_001',    'FA001',    '李建国',     '110101198201040004', '男', '中共党员', '汉族', '天津市', '1982-01-04', null, null, '计算机学院', null, null, '正常', '辅导员', '13800000004', 'fa001@school.edu.cn', null, null, null],
    ['fa_002',    'FA002',    '刘晓慧',     '110101198301050005', '女', '中共党员', '汉族', '河北省', '1983-01-05', null, null, '经济管理学院', null, null, '正常', '辅导员', '13800000005', 'fa002@school.edu.cn', null, null, null],
    ['fa_003',    'FA003',    '陈大明',     '110101198401060006', '男', '共青团员', '汉族', '辽宁省', '1984-01-06', null, null, '外国语学院', null, null, '正常', '辅导员', '13800000006', 'fa003@school.edu.cn', null, null, null],
    ['teacher_001','TCH001',  '孙明辉',     '110101197901070007', '男', '中共党员', '汉族', '黑龙江省', '1979-01-07', null, null, '计算机学院', null, null, '正常', '副教授', '13800000007', 'teach001@school.edu.cn', null, null, null],
  ];

  for (const u of testUsers) {
    try {
      await pool.query(
        `INSERT IGNORE INTO student 
         (id, student_no, name, id_card, gender, political_status, nation, native_place, birth_date,
          enroll_year, grad_year, college, major, class_name, status, position, phone, email,
          emergency_contact_name, emergency_contact_phone, instructor_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        u
      );
    } catch(e) { console.log('Insert user error for', u[0], ':', e.message); }
  }
  console.log('✅ Test users inserted');

  // Supplement student_003~005 with complete data  
  const studentUpdates = [
    ['student_003', JSON.stringify([{name:'王建国',relation:'父亲',phone:'13900003331',work:'建筑工程师'},{name:'吴秀芳',relation:'母亲',phone:'13900003332',work:'会计'}]),
     JSON.stringify([{start:'2022-09',end:'至今',org:'某某大学',role:'在校学生'},{start:'2021-07',end:'2022-07',org:'郑州市XX公司',role:'实习生'}]),
     '本人责任心强，担任班级团支书，积极参与志愿活动，综合素质较为全面。', '13800003333', 'wx_wpeng', '河南省郑州市金水区XX路99号'],
    ['student_004', JSON.stringify([{name:'陈凤英',relation:'母亲',phone:'13900004441',work:'退休教师'},{name:'陈建华',relation:'父亲',phone:'13900004442',work:'个体经营'}]),
     JSON.stringify([{start:'2022-09',end:'2025-03',org:'某某大学',role:'在校学生（休学中）'}]),
     '本人曾任宣传委员，具有较强的艺术创作能力，因健康原因休学，期望早日康复复学。', '13800004444', 'wx_csiy', '湖南省长沙市天心区XX街道1栋2单元'],
    ['student_005', JSON.stringify([{name:'刘建军',relation:'父亲',phone:'13900005551',work:'军人（退役）'},{name:'赵美娟',relation:'母亲',phone:'13900005552',work:'幼儿园教师'}]),
     JSON.stringify([{start:'2021-09',end:'至今',org:'某某大学',role:'在校学生'},{start:'2023-07',end:'2023-09',org:'南京某外贸公司',role:'翻译实习生'}]),
     '本人英语口语流利，曾在英语演讲比赛中获奖，擅长跨文化交流与沟通。', '13800005555', 'wx_liuyang', '江苏省南京市鼓楼区XX新村3号楼'],
  ];

  for (const [id, fm, wh, ps, phone, wechat, address] of studentUpdates) {
    try {
      await pool.query(
        `UPDATE student SET family_members=?, work_history=?, personal_summary=?, phone=?, wechat=?, address=? WHERE id=?`,
        [fm, wh, ps, phone, wechat, address, id]
      );
    } catch(e) { console.log('Update student error for', id, ':', e.message); }
  }
  console.log('✅ Student data supplemented');

  // Add more moral_credit records
  const creditRecords = [
    ['student_001', 1.5, '参与校园文化节志愿服务', 'fa_001', 'approved', 'volunteer'],
    ['student_001', 3.0, '校级英语演讲比赛三等奖', 'fa_001', 'approved', 'competition'],
    ['student_002', 2.0, '担任学习委员表现优秀', 'fa_001', 'approved', 'activity'],
    ['student_002', 5.0, '省级数学建模竞赛二等奖', 'su_001', 'approved', 'competition'],
    ['student_002', -0.5, '图书馆未归还借阅资料', 'fa_001', 'approved', 'discipline'],
    ['student_003', 2.0, '社区志愿服务累计20小时', 'fa_002', 'approved', 'social_practice'],
    ['student_003', 1.0, '积极参与班级建设', 'fa_002', 'approved', 'activity'],
    ['student_004', -1.0, '无故旷课三次', 'fa_002', 'approved', 'discipline'],
    ['student_004', 1.5, '休学前志愿服务加分保留', 'fa_002', 'approved', 'volunteer'],
    ['student_005', 3.0, '英语演讲大赛校级二等奖（已有，追加省赛记录）', 'fa_003', 'approved', 'competition'],
    ['student_005', 2.5, '赴南京企业社会实践表现优秀', 'fa_003', 'approved', 'social_practice'],
    ['student_005', 1.0, '参与校际文化交流活动', 'fa_003', 'approved', 'activity'],
    ['student_001', 2.0, '待审核：暑期三下乡活动申请', 'fa_001', 'pending', 'social_practice'],
    ['student_003', 1.5, '待审核：读书月分享会组织者', 'fa_002', 'pending', 'activity'],
  ];

  for (const [sid, change, reason, operator, status, atype] of creditRecords) {
    try {
      await pool.query(
        `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status, activity_type) VALUES (?,?,?,?,?,?)`,
        [sid, change, reason, operator, status, atype]
      );
    } catch(e) { console.log('Credit insert error:', e.message); }
  }
  console.log('✅ Moral credit records added');

  // Add more honor applications
  const extraApplications = [
    ['student_001', 7,  '[]', '连续两学期综合排名前5%，三好学生评定申请', 'pending', null],
    ['student_005', 4,  '[]', '省级演讲比赛获奖，同时积极参与校园文化活动', 'approved', 'admin_sys'],
    ['student_003', 9,  '[]', '本学年学业成绩优秀，获得校级一等奖学金申请', 'rejected', 'su_001'],
  ];
  for (const [sid, cid, proof, desc, status, reviewer] of extraApplications) {
    try {
      await pool.query(
        `INSERT IGNORE INTO honor_applications (student_id, category_id, proof_urls, description, status, reviewer_id)
         SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM honor_applications WHERE student_id=? AND category_id=? AND status NOT IN ('rejected'))`,
        [sid, cid, proof, desc, status, reviewer, sid, cid]
      );
    } catch(e) { console.log('App insert error:', e.message); }
  }
  console.log('✅ Honor applications added');

  // Add corresponding student_honors for newly approved
  try {
    await pool.query(`
      INSERT IGNORE INTO student_honors (student_id, category_id, application_id, issue_date, issuer)
      SELECT a.student_id, a.category_id, a.id, CURDATE(), '学校官方'
      FROM honor_applications a
      WHERE a.status = 'approved'
        AND NOT EXISTS (SELECT 1 FROM student_honors h WHERE h.application_id = a.id)
    `);
    console.log('✅ student_honors synced');
  } catch(e) { console.log('Honors sync error:', e.message); }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
