import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email1 = `recovery_test_${Date.now()}@example.com`;
  const email2 = `signup_test_${Date.now()}@example.com`;
  
  console.log(`Creating recovery test user: ${email1}`);
  const { data: newUser1 } = await adminClient.auth.admin.createUser({
    email: email1,
    password: 'password123',
    email_confirm: true
  });
  
  try {
    // RECOVERY
    const { data: linkData1 } = await adminClient.auth.admin.generateLink({ type: 'recovery', email: email1 });
    const { data: sessionData1 } = await anonClient.auth.verifyOtp({ email: email1, token: linkData1.properties.email_otp, type: 'recovery' });
    const jwt1 = sessionData1.session?.access_token;
    const payload1 = JSON.parse(Buffer.from(jwt1!.split('.')[1], 'base64').toString('utf8'));

    // SIGNUP
    console.log(`Creating signup test user: ${email2}`);
    // Wait, generateLink with type 'signup' requires a password
    const { data: linkData2 } = await adminClient.auth.admin.generateLink({ type: 'signup', email: email2, password: 'password123' });
    const { data: sessionData2 } = await anonClient.auth.verifyOtp({ email: email2, token: linkData2.properties.email_otp, type: 'signup' });
    const jwt2 = sessionData2.session?.access_token;
    const payload2 = JSON.parse(Buffer.from(jwt2!.split('.')[1], 'base64').toString('utf8'));

    console.log("\n================ RECOVERY JWT ================\n");
    console.log(JSON.stringify(payload1, null, 2));
    
    console.log("\n================ SIGNUP JWT ================\n");
    console.log(JSON.stringify(payload2, null, 2));

  } finally {
    console.log(`Cleaning up test users...`);
    await adminClient.auth.admin.deleteUser(newUser1!.user.id);
    // Cleanup the signup user if it was created
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const signupUser = users.find(u => u.email === email2);
    if (signupUser) await adminClient.auth.admin.deleteUser(signupUser.id);
  }
}

run().catch(console.error);
