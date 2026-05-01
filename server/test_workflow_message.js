import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('=== Starting Message UI & Delete Test ===');
  
  try {
    // 1. Login as student
    console.log('1. Logging in as student...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'stu_002', password: '123' })
    });
    const { token } = await loginRes.json();
    console.log('Student token acquired.');

    // 2. Fetch conversations
    console.log('2. Fetching conversations...');
    const convRes = await fetch(`${BASE_URL}/message/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const conversations = await convRes.json();
    console.log(`Found ${conversations.length} conversations.`);

    if (conversations.length > 0) {
      console.log('Conversation contact avatar test:', conversations[0].messages[0].sender_avatar || conversations[0].messages[0].receiver_avatar || 'No avatar (Expected for system users)');
    }

    // 3. Send a test message
    console.log('3. Sending test message to college_admin...');
    const sendRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ receiver_id: 'college_002', content: '这是一条自动测试生成的站内信。' })
    });
    const sendResultText = await sendRes.text();
    console.log('Send result:', sendResultText);

    // 4. Fetch conversations again
    console.log('4. Fetching conversations again...');
    const convRes2 = await fetch(`${BASE_URL}/message/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const conversations2 = await convRes2.json();
    console.log(`Found ${conversations2.length} conversations after sending.`);

    // 5. Delete the conversation we just created/updated
    console.log('5. Deleting conversation with college_002...');
    const delRes = await fetch(`${BASE_URL}/message/conversation`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ contact_id: 'college_002' })
    });
    const delResultText = await delRes.text();
    console.log('Delete result:', delResultText);

    // 6. Verify deletion
    console.log('6. Verifying deletion...');
    const convRes3 = await fetch(`${BASE_URL}/message/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const conversations3 = await convRes3.json();
    const stillExists = conversations3.some(c => c.contact_id === 'college_002');
    console.log('Conversation still exists?', stillExists);

    if (!stillExists) {
      console.log('=== Test Completed Successfully ===');
    } else {
      console.error('=== Test Failed: Conversation was not deleted ===');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

runTest();