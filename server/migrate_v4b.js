import pool from './db.js';

async function fix() {
  // Check current columns
  const [cols] = await pool.query('SHOW COLUMNS FROM moral_credit');
  console.log('Current columns:', cols.map(c => c.Field));

  const hasActivityType = cols.some(c => c.Field === 'activity_type');
  if (!hasActivityType) {
    try {
      await pool.query(`ALTER TABLE moral_credit ADD COLUMN activity_type VARCHAR(50) DEFAULT 'manual' COMMENT '来源类型'`);
      console.log('✅ activity_type column added');
    } catch(e) {
      console.log('Add column error:', e.message);
    }
  } else {
    console.log('ℹ️  activity_type already exists');
  }

  // Now insert credit records
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
    ['student_005', 1.5, '省级英语演讲大赛三等奖', 'fa_003', 'approved', 'competition'],
    ['student_005', 2.5, '赴南京企业社会实践表现优秀', 'fa_003', 'approved', 'social_practice'],
    ['student_005', 1.0, '参与校际文化交流活动', 'fa_003', 'approved', 'activity'],
    ['student_001', 2.0, '暑期三下乡活动申请', 'fa_001', 'pending', 'social_practice'],
    ['student_003', 1.5, '读书月分享会组织者', 'fa_002', 'pending', 'activity'],
  ];

  let inserted = 0;
  for (const r of creditRecords) {
    try {
      await pool.query(
        `INSERT INTO moral_credit (student_id, credit_change, reason, operated_by, status, activity_type) VALUES (?,?,?,?,?,?)`,
        r
      );
      inserted++;
    } catch(e) {
      console.log('Credit insert error:', e.message, r[0]);
    }
  }
  console.log(`✅ Inserted ${inserted} credit records`);
  
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
