import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ [DATABASE] Supabase credentials missing!')
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing')
    throw new Error('Supabase admin credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!cachedClient) {
    console.log('🔗 [DATABASE] Creating Supabase client...')
    console.log('   URL:', SUPABASE_URL)
    
    cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'doctor-frontend-mri-upload',
        },
      },
    })
    
    // Test connection
    try {
      const { error } = await cachedClient.from('patients').select('count').limit(1)
      if (error) {
        console.error('❌ [DATABASE] Connection test failed:', error.message)
      } else {
        console.log('✅ [DATABASE] Successfully connected to Supabase!')
      }
    } catch (err) {
      console.error('❌ [DATABASE] Connection test error:', err)
    }
  }

  return cachedClient
}
