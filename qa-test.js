const http = require('http');

async function testRedirect(path, expectedLocation) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location.includes(expectedLocation)) {
        console.log(`✅ [Redirect Test] ${path} correctly redirected to ${expectedLocation}`);
      } else {
        console.log(`❌ [Redirect Test] ${path} failed. Status: ${res.statusCode}, Location: ${res.headers.location}`);
      }
      resolve();
    }).on('error', (e) => {
      console.log(`❌ [Redirect Test] Network error on ${path}`);
      resolve();
    });
  });
}

async function runQATests() {
  console.log("Running QA tests...");
  // Note: These tests require an active session in the database.
  // We'll fetch the test session ID first.
  let sessionId = null;
  await new Promise((resolve) => {
    http.get('http://localhost:3000/api/test-session', (res) => {
      const location = res.headers.location;
      if (location) {
        const match = location.match(/\/session\/([^\/]+)\/learn/);
        if (match) sessionId = match[1];
      }
      resolve();
    });
  });

  if (!sessionId) {
    console.log("Could not get session ID from /test-session");
    return;
  }
  
  console.log(`Session created: ${sessionId}`);

  // Test 2: Backward redirects
  // Currently session is in 'learn'
  await testRedirect(`/session/${sessionId}/recall`, '/learn');
  await testRedirect(`/session/${sessionId}/challenge`, '/learn');
  await testRedirect(`/session/${sessionId}/feedback`, '/learn');
  
  // Test invalid session ID
  await testRedirect(`/session/00000000-0000-0000-0000-000000000000/feedback`, 'database error'); // Should fail or redirect

  console.log("Done running automated tests.");
}

runQATests();
