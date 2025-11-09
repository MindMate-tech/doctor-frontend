import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!cachedClient) {
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
  }

  return cachedClient
}
