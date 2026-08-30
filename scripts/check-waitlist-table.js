// Run waitlist migration via Supabase Management API
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const PROJECT_REF = 'kndoposozkemopyuavgb';
const DB_HOST = `db.${PROJECT_REF}.supabase.co`;
const DB_PORT = 5432;

async function runMigration() {
  const sql = fs.readFileSync('supabase/migrations/010_waitlist.sql', 'utf8');

  // Use Supabase's pg_net or direct connection isn't possible from here.
  // Instead, let's use the Supabase Management API with the access token
  // or just run individual table creates via the REST API.

  // Actually, let's just test if the waitlist table already exists
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://kndoposozkemopyuavgb.supabase.co',
    serviceKey
  );

  // Check if table exists by querying it
  const { data, error } = await supabase.from('waitlist').select('id').limit(1);

  if (error && error.code === '42P01') {
    console.log('❌ waitlist table does NOT exist yet.');
    console.log('');
    console.log('Please run the SQL migration manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/kndoposozkemopyuavgb/sql');
    console.log('2. Paste the contents of supabase/migrations/010_waitlist.sql');
    console.log('3. Click "Run"');
  } else if (error) {
    console.log('Error checking:', error.message);
    console.log('');
    console.log('The table may not exist. Please run the migration manually.');
    console.log('Go to: https://supabase.com/dashboard/project/kndoposozkemopyuavgb/sql');
  } else {
    console.log('✅ waitlist table already exists! (found', data.length, 'rows)');
  }
}

runMigration().catch(console.error);
