const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRedirect() {
  console.log("1. Authenticating test user...");
  let session = null;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'signup_test_1786899146284@example.com',
    password: 'password123',
  });

  if (error || !data.session) {
    console.log("Couldn't authenticate test user. Trying signup...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    });
    if (signUpError) {
      console.error("Sign up failed:", signUpError);
      return;
    }
    session = signUpData.session;
  } else {
    session = data.session;
  }

  console.log("2. Fetching /dashboard as authenticated user...");
  const cookieHeader = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${JSON.stringify([
    session.access_token,
    session.refresh_token,
    "",
    "",
    ""
  ])}`;

  const response = await fetch('http://localhost:3000/dashboard', {
    headers: {
      Cookie: cookieHeader
    },
    redirect: 'manual'
  });

  console.log("Status:", response.status);
  console.log("Location:", response.headers.get('location') || 'N/A');
  
  if (response.status === 200) {
    console.log("SUCCESS: Dashboard rendered correctly for authenticated user!");
  } else {
    console.log("FAILED: Unexpected status code.");
  }
}

testRedirect();
