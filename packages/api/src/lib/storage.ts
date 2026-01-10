import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const RECEIPT_BUCKET = 'payment-receipts'
export const RESULTS_BUCKET = 'event-tournament-results'

// Lazy-initialize Supabase admin client to avoid build-time errors when env vars are not available
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables are not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    return _supabaseAdmin
}

/**
 * Delete receipt files from Supabase Storage by their paths
 * @param paths Array of storage paths (e.g., "teamId/eventId/athleteId/receipt.webp")
 */
export async function deleteReceiptsByPaths(paths: string[]): Promise<void> {
    if (paths.length === 0) return

    const { error } = await getSupabaseAdmin().storage
        .from(RECEIPT_BUCKET)
        .remove(paths)

    if (error) {
        console.error('Failed to delete receipts from storage:', error)
    }
}

/**
 * Upload a results file to the public bucket
 * Returns the public URL
 */
export async function uploadResultsFile(
    eventId: string,
    file: Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    const filePath = `${eventId}/${fileName}`

    const { error } = await getSupabaseAdmin().storage
        .from(RESULTS_BUCKET)
        .upload(filePath, file, {
            contentType,
            upsert: true // Replace if exists
        })

    if (error) {
        console.error('Failed to upload results file:', error)
        throw error
    }

    // Return the public URL
    const { data } = getSupabaseAdmin().storage
        .from(RESULTS_BUCKET)
        .getPublicUrl(filePath)

    return data.publicUrl
}

/**
 * Delete a results file from storage
 */
export async function deleteResultsFile(eventId: string, fileName: string): Promise<void> {
    const filePath = `${eventId}/${fileName}`

    const { error } = await getSupabaseAdmin().storage
        .from(RESULTS_BUCKET)
        .remove([filePath])

    if (error) {
        console.error('Failed to delete results file:', error)
    }
}

