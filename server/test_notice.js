import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'sudt_super_secret_jwt_key_2026';
const adminToken = jwt.sign({ id: 'admin', role: 'super_admin' }, JWT_SECRET, { expiresIn: '1h' });

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { Authorization: `Bearer ${adminToken}` }
});

async function runTest() {
  console.log('--- 开始测试公告发布与修改删除全流程 ---');
  let noticeId;

  try {
    // 1. 测试发布公告
    console.log('1. 测试发布 [POST /api/notice] ...');
    const postRes = await api.post('/notice', {
      title: '自动化测试公告',
      content: '这是一条由自动化测试脚本发出的公告，用于检测各项增删改查功能是否完备。',
      type: 'warning',
      publish_level: '保卫处'
    });
    console.log('   发布结果:', postRes.data);

    // 2. 测试获取公告列表
    console.log('2. 测试读取 [GET /api/notice] ...');
    const getRes = await api.get('/notice');
    const target = getRes.data.find(n => n.title === '自动化测试公告');
    if (!target) throw new Error('未在列表中找到刚刚发布的公告！');
    noticeId = target.id;
    console.log(`   读取成功，找到了目标公告 ID: ${noticeId}`);

    // 3. 测试修改公告
    console.log('3. 测试修改 [PUT /api/notice/:id] ...');
    const putRes = await api.put(`/notice/${noticeId}`, {
      title: '自动化测试公告 (已修改)',
      content: '内容已经被成功修改了。',
      type: 'activity',
      publish_level: '学生工作部'
    });
    console.log('   修改结果:', putRes.data);

    // 4. 测试删除公告
    console.log('4. 测试删除 [DELETE /api/notice/:id] ...');
    const delRes = await api.delete(`/notice/${noticeId}`);
    console.log('   删除结果:', delRes.data);

    console.log('--- 测试全部通过，没有抛出任何异常！ ---');
  } catch (error) {
    console.error('--- 测试失败！ ---');
    console.error(error.response?.data || error.message);
  }
}

runTest();