const https = require('node:https');

const email = 'demofresh' + Date.now() + '@test.com';
const data = JSON.stringify({
  email: email,
  password: 'Demo1234!',
  data: { full_name: 'Demo User' }
});

const options = {
  hostname: 'kndoposozkemopyuavgb.supabase.co',
  path: '/auth/v1/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZG9wb3NvemtlbW9weXVhdmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzYyNDQsImV4cCI6MjEwMTk1MjI0NH0.EIT0UgJroVtTiWlGU6LnWsYtKedTS50jUSelcwh6FZI'
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const p = JSON.parse(body);
    console.log('STATUS:', res.statusCode);
    console.log('HAS access_token:', !!p.access_token);
    console.log('HAS session:', !!(p.session || p.access_token));
    console.log('email:', p.email || p.user?.email);
    console.log('confirmed_at:', p.confirmed_at || p.user?.confirmed_at || 'NOT CONFIRMED');
    console.log('email_confirmed_at:', p.email_confirmed_at || p.user?.email_confirmed_at || 'NOT CONFIRMED');
    if (p.error) console.log('ERROR:', p.error, p.msg || p.error_description);
    if (p.access_token) console.log('SUCCESS - User can log in immediately!');
    else console.log('FAIL - No session returned, user needs email confirmation');
  });
});
req.write(data);
req.end();
