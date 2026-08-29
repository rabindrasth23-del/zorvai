/**
 * Apply migration 009 — session_messages table + create storage bucket
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
});

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Check if table already exists
  const { data, error } = await admin.from('session_messages').select('id').limit(1);
  if (!error) {
    console.log('✓ session_messages table already exists');
  } else {
    console.log('✗ session_messages table does not exist yet');
    console.log('  Error:', error.message);
    console.log('');
    console.log('  Please run the following SQL in the Supabase Dashboard SQL Editor:');
    console.log('  https://supabase.com/dashboard/project/kndoposozkemopyuavgb/sql/new');
    console.log('');
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '009_session_messages.sql'),
      'utf8'
    );
    console.log(sql);
    console.log('');
    console.log('  After running, re-run this script to verify.');
    return false;
  }

  // 2. Check/create storage bucket
  const { data: buckets } = await admin.storage.listBuckets();
  const existing = buckets?.find(b => b.name === 'session-uploads');
  
  if (existing) {
    console.log('✓ session-uploads bucket already exists');
  } else {
    const { data: bucket, error: bucketError } = await admin.storage.createBucket('session-uploads', {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024, // 20MB max (PDFs), images checked in route
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ],
    });
    if (bucketError) {
      console.log('✗ Failed to create session-uploads bucket:', bucketError.message);
      return false;
    }
    console.log('✓ session-uploads bucket created');
  }

  console.log('\n✓ All infrastructure ready for Deliverable 1');
  return true;
}

main().catch(console.error);
