const fetch = require('node-fetch'); // Native fetch in Node 18+

async function testRecoveryLock() {
  console.log("Simulating authenticated user with a requires_password_reset cookie...");
  
  // Notice we aren't even passing a valid session token here. 
  // We are just testing if the layout-level lock catches the cookie immediately.
  const response = await fetch('http://localhost:3000/dashboard', {
    headers: {
      Cookie: "requires_password_reset=true;"
    },
    redirect: 'manual'
  });

  console.log("Status:", response.status);
  console.log("Location:", response.headers.get('location') || 'N/A');
  
  if (response.status === 307 && response.headers.get('location').endsWith('/update-password')) {
    console.log("SUCCESS: Recovery Lock accurately intercepts and redirects to /update-password!");
  } else {
    console.log("FAILED: Did not redirect as expected.");
  }
}

testRecoveryLock();
