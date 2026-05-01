async function runAcademicWorkflow() {
  console.log('=== Starting Academic Workflow Test ===');

  // 1. Login Student
  const loginStu = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'stu_001', password: '123' })
  });
  const { token: tokenStu } = await loginStu.json();

  // 2. Student Submits "认证考试报名申请"
  console.log('1. Student submitting Exam Registration...');
  const applyRes = await fetch('http://localhost:3000/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStu}` },
    body: JSON.stringify({
      apply_type: '认证考试报名申请',
      content: '报名四级',
      form_data: { examCategory: 'english', examSubject: 'CET4', examLevel: '4' }
    })
  });
  const applyResult = await applyRes.json();
  const applyId = applyResult.apply_id;
  console.log('Apply ID:', applyId);

  // 3. Login Counselor
  const loginCounselor = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'fa_001', password: '123' })
  });
  const { token: tokenCounselor } = await loginCounselor.json();

  // Counselor should see it as pending (step 1)
  console.log('2. Counselor checking applications...');
  const counselorAppsRes = await fetch('http://localhost:3000/api/apply', {
    headers: { 'Authorization': `Bearer ${tokenCounselor}` }
  });
  const counselorApps = await counselorAppsRes.json();
  const targetApp1 = counselorApps.applications.find(a => a.id === applyId);
  console.log('Found by Counselor:', !!targetApp1, 'Step:', targetApp1?.current_step);

  // Counselor approves
  console.log('3. Counselor approving...');
  await fetch(`http://localhost:3000/api/apply/${applyId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCounselor}` },
    body: JSON.stringify({ action: 'approve', comment: '辅导员同意' })
  });

  // 4. Login College Admin
  const loginCollege = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'college_001', password: '123' })
  });
  const { token: tokenCollege } = await loginCollege.json();

  // College Admin should see it as pending (step 2)
  console.log('4. College Admin checking applications...');
  const collegeAppsRes = await fetch('http://localhost:3000/api/apply', {
    headers: { 'Authorization': `Bearer ${tokenCollege}` }
  });
  const collegeApps = await collegeAppsRes.json();
  const targetApp2 = collegeApps.applications.find(a => a.id === applyId);
  console.log('Found by College Admin:', !!targetApp2, 'Step:', targetApp2?.current_step);

  // College Admin approves
  console.log('5. College Admin approving...');
  await fetch(`http://localhost:3000/api/apply/${applyId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCollege}` },
    body: JSON.stringify({ action: 'approve', comment: '二级学院同意' })
  });

  // 5. Login School Admin (Super Admin) and check Academic View
  const loginAdmin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin_001', password: '123' })
  });
  const { token: tokenAdmin } = await loginAdmin.json();

  console.log('6. School Admin checking Academic View...');
  const academicRes = await fetch('http://localhost:3000/api/apply?view_type=academic', {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  });
  const academicApps = await academicRes.json();
  const targetApp3 = academicApps.applications.find(a => a.id === applyId);
  console.log('Found in Academic View:', !!targetApp3, 'Step:', targetApp3?.current_step, 'Status:', targetApp3?.status);

  console.log('=== Academic Workflow Test Completed ===');
}

runAcademicWorkflow();