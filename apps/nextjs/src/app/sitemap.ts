import type { MetadataRoute } from 'next';
import { db } from '@acme/db/client';
import { event, tournament } from '@acme/db/schema';
import { isNull } from '@acme/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/#torneos`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/#equipos`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/#contacto`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Dynamic event pages
    try {
        const events = await db.query.event.findMany({
            where: isNull(event.deletedAt),
            columns: {
                slug: true,
                updatedAt: true,
            },
        });

        const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
            url: `${baseUrl}/eventos/${e.slug}`,
            lastModified: e.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        return [...staticPages, ...eventPages];
    } catch {
        // If DB is not available, return only static pages
        return staticPages;
    }
}
