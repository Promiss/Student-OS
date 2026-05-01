async function runLeaveWorkflow() {
  console.log('=== Starting 7+ Day Leave Workflow Test ===');

  // 1. Login Student
  const loginStu = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'stu_002', password: '123' })
  });
  const { token: tokenStu } = await loginStu.json();

  // 2. Student Submits "请假申请" (8 days)
  console.log('1. Student submitting 8-day Leave Request...');
  const applyRes = await fetch('http://localhost:3000/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStu}` },
    body: JSON.stringify({
      apply_type: '请假申请',
      content: '生病住院请假8天',
      form_data: { startDate: '2026-05-01', endDate: '2026-05-09' } // 8 days diff
    })
  });
  const applyResult = await applyRes.json();
  const applyId = applyResult.apply_id;
  console.log('Apply ID:', applyId);

  // 3. Login Counselor
  const loginCounselor = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'fa_002', password: '123' })
  });
  const { token: tokenCounselor } = await loginCounselor.json();

  // Counselor approves
  console.log('2. Counselor approving...');
  await fetch(`http://localhost:3000/api/apply/${applyId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCounselor}` },
    body: JSON.stringify({ action: 'approve', comment: '辅导员同意请假' })
  });

  // 4. Login College Admin
  const loginCollege = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'college_002', password: '123' })
  });
  const { token: tokenCollege } = await loginCollege.json();

  // College Admin approves
  console.log('3. College Admin approving...');
  await fetch(`http://localhost:3000/api/apply/${applyId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCollege}` },
    body: JSON.stringify({ action: 'approve', comment: '二级学院同意请假' })
  });

  // 5. Login School Admin
  const loginAdmin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'su_001', password: '123' })
  });
  const { token: tokenAdmin } = await loginAdmin.json();

  console.log('4. School Admin checking applications...');
  const academicRes = await fetch('http://localhost:3000/api/apply', {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  });
  const academicApps = await academicRes.json();
  const targetApp3 = academicApps.applications.find(a => a.id === applyId);
  console.log('Found by School Admin:', !!targetApp3, 'Step:', targetApp3?.current_step, 'Status:', targetApp3?.status);

  // School Admin approves
  console.log('5. School Admin approving...');
  await fetch(`http://localhost:3000/api/apply/${applyId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdmin}` },
    body: JSON.stringify({ action: 'approve', comment: '校级最终同意请假' })
  });

  // Check final status for student
  const finalStuRes = await fetch('http://localhost:3000/api/apply', {
    headers: { 'Authorization': `Bearer ${tokenStu}` }
  });
  const finalStuApps = await finalStuRes.json();
  const finalApp = finalStuApps.applications.find(a => a.id === applyId);
  console.log('Final Status for Student:', finalApp?.status, 'Step:', finalApp?.current_step);

  console.log('=== Leave Workflow Test Completed ===');
}

runLeaveWorkflow();
