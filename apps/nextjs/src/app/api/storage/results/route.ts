import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { db } from '@acme/db/client'
import { event } from '@acme/db/schema'
import { eq } from '@acme/db'
import { auth } from '~/auth/server'

// Use service role for upload access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = 'event-tournament-results'

// Upload results file for an event (admin only)
export async function POST(request: NextRequest) {
    try {
        // Validate user session
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admins can upload results
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const eventId = formData.get('eventId') as string | null

        if (!file || !eventId) {
            return NextResponse.json({ error: 'Missing file or eventId' }, { status: 400 })
        }

        // Verify event exists
        const existingEvent = await db.query.event.findFirst({
            where: eq(event.id, eventId)
        })

        if (!existingEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        // Upload file to public bucket
        const fileName = `results.pdf`
        const filePath = `${eventId}/${fileName}`
        const buffer = await file.arrayBuffer()

        // Delete existing file if any
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath])

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath)

        // Update event with results URL
        await db.update(event)
            .set({ resultsUrl: urlData.publicUrl })
            .where(eq(event.id, eventId))

        return NextResponse.json({ url: urlData.publicUrl })
    } catch (error) {
        console.error('Upload results error:', error)
        return NextResponse.json({ error: 'Failed to upload results' }, { status: 500 })
    }
}

// Delete results file for an event (admin only)
export async function DELETE(request: NextRequest) {
    try {
        // Validate user session
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admins can delete results
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { eventId } = await request.json()

        if (!eventId) {
            return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
        }

        // Delete file from storage
        const filePath = `${eventId}/results.pdf`
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath])

        // Clear URL from database
        await db.update(event)
            .set({ resultsUrl: null })
            .where(eq(event.id, eventId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete results error:', error)
        return NextResponse.json({ error: 'Failed to delete results' }, { status: 500 })
    }
}
