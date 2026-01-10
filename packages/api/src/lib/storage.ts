import { createClient } from '@supabase/supabase-js'

// Use service role for full access (bypasses RLS)
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const RECEIPT_BUCKET = 'payment-receipts'
export const RESULTS_BUCKET = 'event-tournament-results'

/**
 * Delete receipt files from Supabase Storage by their paths
 * @param paths Array of storage paths (e.g., "teamId/eventId/athleteId/receipt.webp")
 */
export async function deleteReceiptsByPaths(paths: string[]): Promise<void> {
    if (paths.length === 0) return

    const { error } = await supabaseAdmin.storage
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

    const { error } = await supabaseAdmin.storage
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
    const { data } = supabaseAdmin.storage
        .from(RESULTS_BUCKET)
        .getPublicUrl(filePath)

    return data.publicUrl
}

/**
 * Delete a results file from storage
 */
export async function deleteResultsFile(eventId: string, fileName: string): Promise<void> {
    const filePath = `${eventId}/${fileName}`

    const { error } = await supabaseAdmin.storage
        .from(RESULTS_BUCKET)
        .remove([filePath])

    if (error) {
        console.error('Failed to delete results file:', error)
    }
}
