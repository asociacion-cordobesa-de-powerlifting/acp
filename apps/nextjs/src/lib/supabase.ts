import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Storage bucket name for payment receipts
export const PAYMENT_RECEIPTS_BUCKET = 'payment-receipts'

// Lazy-initialize Supabase client to avoid build-time errors when env vars are not available
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
    if (_supabase) return _supabase

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are not configured (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey)
    return _supabase
}

// For backwards compatibility - lazy getter
export const supabase = {
    get storage() {
        return getSupabase().storage
    }
}

