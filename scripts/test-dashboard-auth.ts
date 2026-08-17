import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testRedirect() {
  console.log("1. Authenticating test user...");
  // Use the test credentials we know work from earlier
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123',
  });

  if (error || !data.session) {
    console.log("Couldn't authenticate test user. Assuming no user exists or bad credentials. We will create one.");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
    });
    if (signUpError || !signUpData.session) {
      console.error("Sign up failed or no session:", signUpError);
      return;
    }
    data.session = signUpData.session;
  }
  
  if (!data.session) return;

  console.log("2. Fetching /dashboard as authenticated user...");
  // Format the cookies exactly as Next.js expects them for the Supabase SSR client
  const cookieHeader = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token=${JSON.stringify([
    data.session.access_token,
    data.session.refresh_token,
    "",
    "",
    ""
  ])}`;

  const response = await fetch('http://localhost:3000/dashboard', {
    headers: {
      Cookie: cookieHeader
    },
    redirect: 'manual' // We want to catch if it redirects us
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
