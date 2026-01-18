import Link from 'next/link';
import { queryClient, trpc } from '~/trpc/server';
import { TournamentsTable } from './tournaments-table';
import { Button } from '@acme/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function UpcomingTournamentsSection() {
    const events = await queryClient.fetchQuery(trpc.tournaments.publicList.queryOptions());

    // Sort events by date (upcoming first)
    const sortedEvents = events
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    if (sortedEvents.length === 0) {
        return (
            <section
                id="torneos"
                className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                            Próximos Torneos
                        </h2>
                        <p className="text-muted-foreground">
                            No hay torneos programados en este momento
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            id="torneos"
            className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                            Próximos Torneos
                        </h2>
                        <p className="text-muted-foreground">
                            Consulta los torneos programados y sus detalles
                        </p>
                    </div>
                    <Link href="/torneos">
                        <Button variant="outline" className="gap-2">
                            Ver todos los torneos
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <TournamentsTable events={sortedEvents} />
            </div>
        </section>
    );
}
