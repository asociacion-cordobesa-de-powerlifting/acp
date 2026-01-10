import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { db } from '@acme/db/client'
import { teamData, registrations, tournament, athlete } from '@acme/db/schema'
import { eq, and, isNull, inArray } from '@acme/db'
import { auth } from '~/auth/server'

// Use service role for full access (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = 'payment-receipts'

// Generate a fresh signed URL for viewing a receipt
export async function GET(request: NextRequest) {
    try {
        // Validate user session
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const path = searchParams.get('path')

        if (!path) {
            return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
        }

        // Extract teamId from path (format: teamId/eventId/athleteId/filename)
        const pathParts = path.split('/')
        const pathTeamId = pathParts[0]

        // Verify user owns this team OR is admin
        const team = await db.query.teamData.findFirst({
            where: and(eq(teamData.userId, session.user.id), isNull(teamData.deletedAt))
        })

        const isOwner = team?.id === pathTeamId
        const isAdmin = session.user.role === 'admin'

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Generate signed URL (valid for 1 year for better CDN cache hits)
        // Long-lived URLs = more cache hits = cheaper egress ($0.03/GB vs $0.09/GB)
        const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, ONE_YEAR_SECONDS)

        if (error) {
            console.error('Signed URL error:', error)
            return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
        }

        return NextResponse.json({ url: data.signedUrl })
    } catch (error) {
        console.error('Get signed URL error:', error)
        return NextResponse.json({ error: 'Failed to get URL' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        // Validate user session
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user has a team
        const team = await db.query.teamData.findFirst({
            where: and(eq(teamData.userId, session.user.id), isNull(teamData.deletedAt))
        })

        if (!team) {
            return NextResponse.json({ error: 'No team found' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const eventId = formData.get('eventId') as string | null
        const athleteId = formData.get('athleteId') as string | null

        if (!file || !eventId || !athleteId) {
            return NextResponse.json({ error: 'Missing file, eventId, or athleteId' }, { status: 400 })
        }

        // Construct file path with team ID for security
        const fileExt = file.name.split('.').pop() || 'bin'
        const filePath = `${team.id}/${eventId}/${athleteId}/receipt.${fileExt}`

        // Upload using service role
        const buffer = Buffer.from(await file.arrayBuffer())
        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                upsert: true,
                contentType: file.type
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        // Return the file path (NOT a signed URL)
        // The path will be stored in DB and used to generate fresh signed URLs on demand
        return NextResponse.json({
            path: filePath
        })
    } catch (error) {
        console.error('Upload handler error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Validate user session
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user has a team
        const team = await db.query.teamData.findFirst({
            where: and(eq(teamData.userId, session.user.id), isNull(teamData.deletedAt))
        })

        if (!team) {
            return NextResponse.json({ error: 'No team found' }, { status: 403 })
        }

        const { eventId, athleteId } = await request.json()

        if (!eventId || !athleteId) {
            return NextResponse.json({ error: 'Missing eventId or athleteId' }, { status: 400 })
        }

        // List files in the athlete's folder to find and delete
        const folderPath = `${team.id}/${eventId}/${athleteId}`
        const { data: files, error: listError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .list(folderPath)

        if (listError) {
            console.error('List error:', listError)
            return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
        }

        if (files && files.length > 0) {
            const filesToDelete = files.map(f => `${folderPath}/${f.name}`)
            const { error: deleteError } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove(filesToDelete)

            if (deleteError) {
                console.error('Delete error:', deleteError)
                return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete handler error:', error)
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
