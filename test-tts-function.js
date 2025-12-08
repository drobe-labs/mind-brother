// Quick test script for TTS function
// Run with: node test-tts-function.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://opmlzshkxzdixfwgkrrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not set!');
  console.error('Set it with: export VITE_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const functionsUrl = `${SUPABASE_URL}/functions/v1/text-to-speech`;

console.log('🧪 Testing TTS function...');
console.log('URL:', functionsUrl);
console.log('');

// Test 1: OPTIONS request (CORS preflight)
console.log('1️⃣ Testing CORS preflight (OPTIONS)...');
fetch(functionsUrl, {
  method: 'OPTIONS',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
})
.then(res => {
  console.log('   Status:', res.status);
  console.log('   CORS Headers:', {
    'Access-Control-Allow-Origin': res.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': res.headers.get('Access-Control-Allow-Methods')
  });
  console.log('');
  
  // Test 2: Actual TTS request
  console.log('2️⃣ Testing TTS request (POST)...');
  return fetch(functionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      text: 'Hello, this is a test',
      voice_type: 'workout'
    })
  });
})
.then(async res => {
  console.log('   Status:', res.status, res.statusText);
  console.log('   Content-Type:', res.headers.get('content-type'));
  console.log('   Content-Length:', res.headers.get('content-length'));
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('   ❌ Error response:', errorText);
    return;
  }
  
  const blob = await res.blob();
  console.log('   ✅ Success! Audio blob received:');
  console.log('      Size:', blob.size, 'bytes');
  console.log('      Type:', blob.type);
  
  if (blob.size === 0) {
    console.error('   ⚠️ Warning: Blob is empty!');
  }
})
.catch(error => {
  console.error('   ❌ Request failed:', error.message);
  if (error.cause) {
    console.error('   Cause:', error.cause);
  }
});



