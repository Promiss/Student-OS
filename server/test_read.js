import axios from 'axios';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const JWT_SECRET = 'sudt_super_secret_jwt_key_2026';
const adminToken = jwt.sign({ id: 'admin', role: 'super_admin' }, JWT_SECRET, { expiresIn: '1h' });

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { Authorization: `Bearer ${adminToken}` }
});

async function runReadTest() {
  console.log('--- 开始测试“标记已读”全流程 ---');
  let noticeId;

  try {
    // 1. 发一条新的非置顶/重要公告
    console.log('1. 发送测试“最新”公告...');
    const postRes = await api.post('/notice', {
      title: '用于测试已读褪色的公告',
      content: '这应该是一条闪烁最新的公告',
      type: 'notice',
      publish_level: '系统'
    });
    
    // 2. 获取列表，确认它此时 is_read 为 false
    console.log('2. 检查刚发的公告是否为未读...');
    const getRes = await api.get('/notice');
    const target = getRes.data.find(n => n.title === '用于测试已读褪色的公告');
    noticeId = target.id;
    console.log(`   获取到 ID: ${noticeId}, is_read: ${target.is_read}`);
    if (target.is_read !== false) throw new Error('刚发的公告竟然是已读！');

    // 3. 调用标记已读接口
    console.log('3. 调用标记已读接口 POST /notice/:id/read ...');
    const readRes = await api.post(`/notice/${noticeId}/read`);
    console.log('   接口返回:', readRes.data);

    // 4. 直连数据库查 notice_read_log
    console.log('4. 检查 notice_read_log 表中是否真实存在记录...');
    const [rows] = await pool.query('SELECT * FROM notice_read_log WHERE notice_id = ? AND user_id = ?', [noticeId, 'admin']);
    console.log(`   查到的已读记录数: ${rows.length}`);
    if (rows.length === 0) throw new Error('数据库 notice_read_log 中居然没写入！');

    // 5. 再次请求列表接口，看 is_read 是否变成了 true
    console.log('5. 重新获取公告列表...');
    const getRes2 = await api.get('/notice');
    const target2 = getRes2.data.find(n => n.id === noticeId);
    console.log(`   此时该公告 is_read: ${target2.is_read}`);
    if (target2.is_read !== true) throw new Error('接口返回依旧是未读，后端 SQL LEFT JOIN 可能出错了！');

    console.log('--- 所有后端读写逻辑全部正确闭环！ ---');
    process.exit(0);
  } catch (error) {
    console.error('--- 测试发现 BUG！ ---');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

runReadTest();