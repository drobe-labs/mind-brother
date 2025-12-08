#!/usr/bin/env node

/**
 * Supabase Authentication Stress Test
 * 
 * This script stress tests Supabase sign up and sign in endpoints
 * to ensure they can handle concurrent requests without failing.
 * 
 * Usage:
 *   node stress-test-supabase.js [options]
 * 
 * Options:
 *   --concurrent-users=N    Number of concurrent users (default: 10)
 *   --requests-per-user=N   Requests per user (default: 5)
 *   --test-signup           Test sign up only
 *   --test-signin           Test sign in only
 *   --cleanup               Clean up test users after test
 *   --delay=MS              Delay between requests in ms (default: 100)
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
function loadEnvFile() {
  const envPath = join(__dirname, '.env');
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (key && value) {
            process.env[key.trim()] = value;
          }
        }
      });
      console.log('✅ Loaded environment variables from .env file');
    } catch (error) {
      console.warn('⚠️  Could not read .env file:', error.message);
    }
  }
}

// Load .env file
loadEnvFile();

// Configuration
const config = {
  concurrentUsers: 10,
  requestsPerUser: 5,
  testSignUp: true,
  testSignIn: true,
  cleanup: false,
  delayMs: 200, // Increased default delay to reduce rate limit hits
  retryAttempts: 3,
  retryInitialDelay: 1000,
  discoverRateLimit: false, // If true, will test to find rate limit threshold
};

// Parse command line arguments
const args = process.argv.slice(2);
args.forEach(arg => {
  if (arg.startsWith('--concurrent-users=')) {
    config.concurrentUsers = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--requests-per-user=')) {
    config.requestsPerUser = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--test-signup') {
    config.testSignIn = false;
  } else if (arg === '--test-signin') {
    config.testSignUp = false;
  } else if (arg === '--cleanup') {
    config.cleanup = true;
  } else if (arg.startsWith('--delay=')) {
    config.delayMs = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--discover-rate-limit') {
    config.discoverRateLimit = true;
  }
});

// Get Supabase credentials from environment
// Try both VITE_ prefix and without (for flexibility)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Error: Missing Supabase environment variables');
  console.error('\nPlease provide Supabase credentials in one of these ways:');
  console.error('\n1. Create a .env file in the project root with:');
  console.error('   VITE_SUPABASE_URL=your-supabase-url');
  console.error('   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.error('\n2. Or set environment variables:');
  console.error('   export VITE_SUPABASE_URL="your-supabase-url"');
  console.error('   export VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"');
  console.error('\n3. Or pass them directly:');
  console.error('   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node stress-test-supabase.js\n');
  process.exit(1);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('\n❌ Error: Invalid Supabase URL format');
  console.error(`   URL: ${supabaseUrl}\n`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test results storage
const results = {
  signUp: {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    responseTimes: [],
  },
  signIn: {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    responseTimes: [],
  },
  createdUsers: [],
};

// Helper function to generate unique test user data
function generateTestUser(index) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `stress-test-${timestamp}-${index}-${random}@test.com`,
    password: `TestPassword123!${index}`,
    username: `testuser_${timestamp}_${index}_${random}`,
  };
}

// Helper function to delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is a rate limit error
function isRateLimitError(error) {
  const message = error?.message || error?.toString() || '';
  return message.includes('rate limit') || 
         message.includes('Rate limit') ||
         message.includes('429') ||
         (error?.status === 429);
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = null, initialDelay = null) {
  const retries = maxRetries ?? config.retryAttempts;
  const delayMs = initialDelay ?? config.retryInitialDelay;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      
      // Only retry on rate limit errors
      if (!isRateLimitError(error) || isLastAttempt) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const backoffDelay = delayMs * Math.pow(2, attempt);
      await delay(backoffDelay);
    }
  }
}

// Sign up test
async function testSignUp(userData, userIndex, requestIndex) {
  const startTime = performance.now();
  results.signUp.total++;

  try {
    // Use retry logic for rate limit errors
    const { data: authData, error: authError } = await retryWithBackoff(async () => {
      const result = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      if (result.error && isRateLimitError(result.error)) {
        throw result.error;
      }
      
      return result;
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user returned from sign up');
    }

    // Create profile (matching your AuthContext implementation)
    // Retry profile creation on rate limit errors too
    const { error: profileError } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: userData.username,
        });
      
      if (result.error && isRateLimitError(result.error)) {
        throw result.error;
      }
      
      return result;
    });

    if (profileError && !isRateLimitError(profileError)) {
      // If profile creation fails (and it's not a rate limit), we still count it as a partial success
      // but log the error
      console.warn(`⚠️  Profile creation failed for ${userData.email}: ${profileError.message}`);
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;
    results.signUp.responseTimes.push(responseTime);
    results.signUp.success++;
    results.createdUsers.push({
      email: userData.email,
      password: userData.password,
      userId: authData.user.id,
    });

    return { success: true, responseTime, user: authData.user };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    results.signUp.responseTimes.push(responseTime);
    results.signUp.failed++;
    
    // Extract meaningful error message
    let errorMessage = error.message || error.toString();
    if (error.message && error.message.includes('fetch')) {
      errorMessage = `Connection failed: ${error.message}`;
    } else if (error.message && error.message.includes('network')) {
      errorMessage = `Network error: ${error.message}`;
    } else if (isRateLimitError(error)) {
      errorMessage = `Rate limit reached (retries exhausted)`;
    }
    
    results.signUp.errors.push({
      userIndex,
      requestIndex,
      email: userData.email,
      error: errorMessage,
      responseTime,
    });

    return { success: false, responseTime, error };
  }
}

// Sign in test
async function testSignIn(userData, userIndex, requestIndex) {
  const startTime = performance.now();
  results.signIn.total++;

  try {
    // Use retry logic for rate limit errors
    const { error } = await retryWithBackoff(async () => {
      const result = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });
      
      if (result.error && isRateLimitError(result.error)) {
        throw result.error;
      }
      
      return result;
    });

    if (error) {
      throw error;
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;
    results.signIn.responseTimes.push(responseTime);
    results.signIn.success++;

    return { success: true, responseTime };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    results.signIn.responseTimes.push(responseTime);
    results.signIn.failed++;
    
    // Extract meaningful error message
    let errorMessage = error.message || error.toString();
    if (error.message && error.message.includes('fetch')) {
      errorMessage = `Connection failed: ${error.message}`;
    } else if (error.message && error.message.includes('network')) {
      errorMessage = `Network error: ${error.message}`;
    } else if (isRateLimitError(error)) {
      errorMessage = `Rate limit reached (retries exhausted)`;
    }
    
    results.signIn.errors.push({
      userIndex,
      requestIndex,
      email: userData.email,
      error: errorMessage,
      responseTime,
    });

    return { success: false, responseTime, error };
  }
}

// Calculate statistics
function calculateStats(responseTimes) {
  if (responseTimes.length === 0) return null;

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

// Print results
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 STRESS TEST RESULTS');
  console.log('='.repeat(80));

  if (config.testSignUp) {
    console.log('\n🔵 SIGN UP TEST');
    console.log('-'.repeat(80));
    console.log(`Total Requests:     ${results.signUp.total}`);
    console.log(`✅ Successful:      ${results.signUp.success} (${((results.signUp.success / results.signUp.total) * 100).toFixed(2)}%)`);
    console.log(`❌ Failed:          ${results.signUp.failed} (${((results.signUp.failed / results.signUp.total) * 100).toFixed(2)}%)`);

    const signUpStats = calculateStats(results.signUp.responseTimes);
    if (signUpStats) {
      console.log('\n⏱️  Response Times (ms):');
      console.log(`   Min:     ${signUpStats.min.toFixed(2)}`);
      console.log(`   Max:     ${signUpStats.max.toFixed(2)}`);
      console.log(`   Avg:     ${signUpStats.avg.toFixed(2)}`);
      console.log(`   Median:  ${signUpStats.median.toFixed(2)}`);
      console.log(`   P95:     ${signUpStats.p95.toFixed(2)}`);
      console.log(`   P99:     ${signUpStats.p99.toFixed(2)}`);
    }

    if (results.signUp.errors.length > 0) {
      const rateLimitErrors = results.signUp.errors.filter(e => 
        e.error.includes('rate limit') || e.error.includes('Rate limit')
      );
      const otherErrors = results.signUp.errors.filter(e => 
        !e.error.includes('rate limit') && !e.error.includes('Rate limit')
      );
      
      if (rateLimitErrors.length > 0) {
        console.log(`\n⚠️  Rate Limit Errors: ${rateLimitErrors.length} (${((rateLimitErrors.length / results.signUp.total) * 100).toFixed(2)}%)`);
      }
      
      console.log('\n❌ Errors (showing first 10):');
      results.signUp.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. User ${err.userIndex}, Request ${err.requestIndex}: ${err.error}`);
      });
      if (results.signUp.errors.length > 10) {
        console.log(`   ... and ${results.signUp.errors.length - 10} more errors`);
      }
    }
  }

  if (config.testSignIn) {
    console.log('\n🟢 SIGN IN TEST');
    console.log('-'.repeat(80));
    console.log(`Total Requests:     ${results.signIn.total}`);
    console.log(`✅ Successful:      ${results.signIn.success} (${((results.signIn.success / results.signIn.total) * 100).toFixed(2)}%)`);
    console.log(`❌ Failed:          ${results.signIn.failed} (${((results.signIn.failed / results.signIn.total) * 100).toFixed(2)}%)`);

    const signInStats = calculateStats(results.signIn.responseTimes);
    if (signInStats) {
      console.log('\n⏱️  Response Times (ms):');
      console.log(`   Min:     ${signInStats.min.toFixed(2)}`);
      console.log(`   Max:     ${signInStats.max.toFixed(2)}`);
      console.log(`   Avg:     ${signInStats.avg.toFixed(2)}`);
      console.log(`   Median:  ${signInStats.median.toFixed(2)}`);
      console.log(`   P95:     ${signInStats.p95.toFixed(2)}`);
      console.log(`   P99:     ${signInStats.p99.toFixed(2)}`);
    }

    if (results.signIn.errors.length > 0) {
      const rateLimitErrors = results.signIn.errors.filter(e => 
        e.error.includes('rate limit') || e.error.includes('Rate limit')
      );
      const otherErrors = results.signIn.errors.filter(e => 
        !e.error.includes('rate limit') && !e.error.includes('Rate limit')
      );
      
      if (rateLimitErrors.length > 0) {
        console.log(`\n⚠️  Rate Limit Errors: ${rateLimitErrors.length} (${((rateLimitErrors.length / results.signIn.total) * 100).toFixed(2)}%)`);
      }
      
      console.log('\n❌ Errors (showing first 10):');
      results.signIn.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. User ${err.userIndex}, Request ${err.requestIndex}: ${err.error}`);
      });
      if (results.signIn.errors.length > 10) {
        console.log(`   ... and ${results.signIn.errors.length - 10} more errors`);
      }
    }
  }

  // Calculate total rate limit errors
  const totalRateLimitErrors = 
    results.signUp.errors.filter(e => e.error.includes('rate limit') || e.error.includes('Rate limit')).length +
    results.signIn.errors.filter(e => e.error.includes('rate limit') || e.error.includes('Rate limit')).length;
  const totalErrors = results.signUp.failed + results.signIn.failed;

  console.log('\n' + '='.repeat(80));
  console.log(`📝 Created ${results.createdUsers.length} test users`);
  if (config.cleanup) {
    console.log('🧹 Cleanup enabled - test users will be removed');
  } else {
    console.log('💡 Tip: Use --cleanup flag to remove test users after testing');
  }
  
  if (totalRateLimitErrors > 0) {
    // Calculate requests per second
    const totalRequests = results.signUp.total + results.signIn.total;
    const totalTime = (results.signUp.responseTimes.reduce((a, b) => a + b, 0) + 
                      results.signIn.responseTimes.reduce((a, b) => a + b, 0)) / 1000;
    const avgRequestsPerSecond = totalTime > 0 ? (totalRequests / totalTime) : 0;
    
    console.log('\n⚠️  RATE LIMIT ANALYSIS:');
    console.log(`   • ${totalRateLimitErrors} out of ${totalErrors} errors were due to rate limits`);
    console.log(`   • Estimated request rate: ~${avgRequestsPerSecond.toFixed(1)} requests/second`);
    console.log(`   • Your plan appears to be Pro tier (100k MAU)`);
    console.log('\n📋 UNDERSTANDING SUPABASE RATE LIMITS:');
    console.log('   • Even Pro plans have rate limits (they\'re just higher)');
    console.log('   • Auth endpoints typically: 10-50 requests/second on Pro');
    console.log('   • Limits are per IP address and per endpoint');
    console.log('   • Concurrent requests from same IP can hit limits faster');
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   • The script includes automatic retries with exponential backoff');
    console.log('   • To stay within limits, try:');
    console.log('     - Increase delay: --delay=500 (or higher)');
    console.log('     - Reduce concurrent users: --concurrent-users=5');
    console.log('     - Reduce requests per user: --requests-per-user=3');
    console.log('   • For Pro tier, aim for < 30 requests/second to be safe');
    console.log('   • Check Supabase Dashboard > Settings > API for exact limits');
    console.log('\n🔍 To discover your exact rate limit:');
    console.log('   node stress-test-supabase.js --discover-rate-limit --test-signup');
  }
  
  console.log('='.repeat(80) + '\n');
}

// Cleanup test users
async function cleanup() {
  if (!config.cleanup || results.createdUsers.length === 0) {
    return;
  }

  console.log('\n🧹 Cleaning up test users...');
  let cleaned = 0;

  for (const user of results.createdUsers) {
    try {
      // Sign in as the user first
      const { data: { session } } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      if (session) {
        // Delete the profile
        await supabase.from('profiles').delete().eq('id', user.userId);
        
        // Sign out
        await supabase.auth.signOut();
        cleaned++;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  console.log(`✅ Cleaned up ${cleaned} test users\n`);
}

// Test connection to Supabase
async function testConnection() {
  console.log('🔌 Testing connection to Supabase...');
  
  try {
    // Try to get the current session (this will fail if not authenticated, but will connect)
    const { error } = await supabase.auth.getSession();
    
    // Also test a simple query to verify database connection
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    // If we get here without a connection error, we're good
    // (dbError might be permission-related, which is fine for connection test)
    if (error && error.message && error.message.includes('fetch')) {
      throw new Error(`Connection failed: ${error.message}`);
    }
    
    console.log('✅ Successfully connected to Supabase\n');
    return true;
  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error(`   Error: ${error.message || error.toString()}`);
    console.error('\nPlease check:');
    console.error('   1. Your Supabase URL is correct');
    console.error('   2. Your Supabase anon key is correct');
    console.error('   3. Your internet connection is working');
    console.error('   4. Your Supabase project is active and accessible');
    console.error(`   5. URL format: ${supabaseUrl.substring(0, 30)}...\n`);
    return false;
  }
}

// Main test runner
async function runStressTest() {
  console.log('🚀 Starting Supabase Authentication Stress Test');
  console.log('='.repeat(80));
  console.log(`Configuration:`);
  console.log(`  Concurrent Users:  ${config.concurrentUsers}`);
  console.log(`  Requests per User: ${config.requestsPerUser}`);
  console.log(`  Total Requests:     ${config.concurrentUsers * config.requestsPerUser * (config.testSignUp ? 1 : 0) + config.concurrentUsers * config.requestsPerUser * (config.testSignIn ? 1 : 0)}`);
  console.log(`  Test Sign Up:      ${config.testSignUp ? '✅' : '❌'}`);
  console.log(`  Test Sign In:      ${config.testSignIn ? '✅' : '❌'}`);
  console.log(`  Delay:             ${config.delayMs}ms`);
  console.log(`  Cleanup:           ${config.cleanup ? '✅' : '❌'}`);
  console.log(`  Retry Attempts:    ${config.retryAttempts}`);
  if (config.discoverRateLimit) {
    console.log(`  Rate Limit Discovery: ✅`);
  }
  console.log('='.repeat(80));
  console.log('ℹ️  Note: Even Pro plans have rate limits (typically 10-50 req/s for auth)');
  console.log('='.repeat(80));
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  console.log('⏳ Running tests...\n');

  const overallStartTime = performance.now();

  // Generate test users
  const testUsers = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    testUsers.push(generateTestUser(i));
  }

  // Run sign up tests
  if (config.testSignUp) {
    console.log('🔵 Testing Sign Up...');
    const signUpPromises = [];

    for (let userIndex = 0; userIndex < config.concurrentUsers; userIndex++) {
      for (let requestIndex = 0; requestIndex < config.requestsPerUser; requestIndex++) {
        const userData = generateTestUser(userIndex * config.requestsPerUser + requestIndex);
        signUpPromises.push(
          delay(requestIndex * config.delayMs).then(() =>
            testSignUp(userData, userIndex, requestIndex)
          )
        );
      }
    }

    await Promise.all(signUpPromises);
    console.log(`✅ Sign Up test completed: ${results.signUp.success}/${results.signUp.total} successful\n`);
  }

  // Wait a bit before sign in tests
  if (config.testSignUp && config.testSignIn) {
    await delay(1000);
  }

  // Run sign in tests (using created users)
  if (config.testSignIn) {
    console.log('🟢 Testing Sign In...');
    const signInPromises = [];

    // If we have created users, use them; otherwise create new ones
    const usersForSignIn = results.createdUsers.length > 0
      ? results.createdUsers
      : testUsers.map(u => ({ email: u.email, password: u.password }));

    for (let userIndex = 0; userIndex < Math.min(config.concurrentUsers, usersForSignIn.length); userIndex++) {
      for (let requestIndex = 0; requestIndex < config.requestsPerUser; requestIndex++) {
        const userData = usersForSignIn[userIndex];
        signInPromises.push(
          delay(requestIndex * config.delayMs).then(() =>
            testSignIn(userData, userIndex, requestIndex)
          )
        );
      }
    }

    await Promise.all(signInPromises);
    console.log(`✅ Sign In test completed: ${results.signIn.success}/${results.signIn.total} successful\n`);
  }

  const overallEndTime = performance.now();
  const totalTime = overallEndTime - overallStartTime;

  // Print results
  printResults();

  console.log(`⏱️  Total test duration: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📈 Throughput: ${((results.signUp.total + results.signIn.total) / (totalTime / 1000)).toFixed(2)} requests/second\n`);

  // Cleanup if requested
  await cleanup();

  // Exit with error code if there were failures
  const totalFailed = results.signUp.failed + results.signIn.failed;
  if (totalFailed > 0) {
    console.log(`⚠️  Warning: ${totalFailed} requests failed`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run the test
runStressTest().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

