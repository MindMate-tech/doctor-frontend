/**
 * Health Check Utility
 * Tests connectivity to backend API and database on startup
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-emrj.onrender.com';

/**
 * Test backend API connectivity
 */
export async function testBackendConnection() {
  console.log('🔍 [HEALTH CHECK] Testing backend API connection...');
  console.log('   Target URL:', BACKEND_API_URL);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${BACKEND_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [HEALTH CHECK] Backend API connected successfully!');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return { success: true, data };
    } else {
      console.error('⚠️ [HEALTH CHECK] Backend API returned error status:', response.status);
      return { success: false, status: response.status };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ [HEALTH CHECK] Backend API connection timeout (>5s)');
    } else {
      console.error('❌ [HEALTH CHECK] Backend API connection failed:', error);
    }
    return { success: false, error };
  }
}

/**
 * Test database connectivity via Supabase
 */
export async function testDatabaseConnection() {
  console.log('🔍 [HEALTH CHECK] Testing database connection...');

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasCredentials = !!(SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.log('   Credentials:', hasCredentials ? '✓ Set' : '✗ Missing');

  if (!hasCredentials) {
    console.error('❌ [HEALTH CHECK] Database credentials not configured');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    // Test via API route to avoid importing server-side code
    const response = await fetch('/api/health/database', {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [HEALTH CHECK] Database connected successfully!');
      console.log('   Response:', data);
      return { success: true, data };
    } else {
      console.error('⚠️ [HEALTH CHECK] Database check returned error:', response.status);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ [HEALTH CHECK] Database connection check failed:', error);
    return { success: false, error };
  }
}

/**
 * Run all health checks
 */
export async function runHealthChecks() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏥 MINDMATE HEALTH CHECK - Starting...');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const results = await Promise.allSettled([
    testBackendConnection(),
    testDatabaseConnection(),
  ]);

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏥 MINDMATE HEALTH CHECK - Summary');
  console.log('═══════════════════════════════════════════════════════');
  
  const [backendResult, databaseResult] = results;
  
  console.log('Backend API:', backendResult.status === 'fulfilled' && backendResult.value.success ? '✅ Connected' : '❌ Failed');
  console.log('Database:', databaseResult.status === 'fulfilled' && databaseResult.value.success ? '✅ Connected' : '❌ Failed');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  return {
    backend: backendResult.status === 'fulfilled' ? backendResult.value : { success: false },
    database: databaseResult.status === 'fulfilled' ? databaseResult.value : { success: false },
  };
}
