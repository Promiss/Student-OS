
const testLogin = async () => {
  try {
    console.log('Testing SSO Login Endpoint...');
    // Simulate login for different roles
    const testCases = [
      { username: 'student_123', pass: 'pwd' },
      { username: 'admin_sys', pass: 'pwd' },
      { username: 'fa_teacher', pass: 'pwd' }
    ];

    let allPassed = true;

    for (const testCase of testCases) {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testCase.username, password: testCase.pass })
      });
      const data = await response.json();
      console.log(`Login response for ${testCase.username}:`, data.user_info.role);
      
      if (!data.success || !data.token) {
        allPassed = false;
        break;
      }
    }

    if (allPassed) {
      console.log('All login tests passed!');
    } else {
      console.log('Some login tests failed.');
    }

  } catch (error) {
    console.error('Testing error:', error);
  }
};

testLogin();
