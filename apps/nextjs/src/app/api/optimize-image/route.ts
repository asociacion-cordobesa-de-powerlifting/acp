import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Check if it's an image
        const isImage = file.type.startsWith('image/')

        if (!isImage) {
            // If not an image (e.g., PDF), return as-is
            const arrayBuffer = await file.arrayBuffer()
            return new NextResponse(arrayBuffer, {
                headers: {
                    'Content-Type': file.type,
                    'X-Original-Name': file.name,
                    'X-Is-Image': 'false'
                }
            })
        }

        // Optimize image to webp
        const buffer = Buffer.from(await file.arrayBuffer())
        const optimizedBuffer = await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer()

        // Convert Buffer to Uint8Array for NextResponse
        const uint8Array = new Uint8Array(optimizedBuffer)

        return new NextResponse(uint8Array, {
            headers: {
                'Content-Type': 'image/webp',
                'X-Original-Name': file.name.replace(/\.[^/.]+$/, '.webp'),
                'X-Is-Image': 'true'
            }
        })
    } catch (error) {
        console.error('Image optimization error:', error)
        return NextResponse.json({ error: 'Failed to optimize image' }, { status: 500 })
    }
}
