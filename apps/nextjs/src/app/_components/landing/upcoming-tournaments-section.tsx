import { queryClient, trpc } from '~/trpc/server';
import { TournamentsTable } from './tournaments-table';

export default async function UpcomingTournamentsSection() {
    const events = await queryClient.fetchQuery(trpc.tournaments.publicList.queryOptions());

    // Flatten events into individual tournament rows
    const allTournaments = events.flatMap(event =>
        event.tournaments.map(tournament => ({
            ...tournament,
            eventName: event.name,
            eventSlug: event.slug,
            venue: event.venue,
            location: event.location,
            startDate: event.startDate,
            endDate: event.endDate,
        }))
    );

    // Sort by date (most recent first for finished, upcoming first for open)
    const sortedTournaments = allTournaments
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    if (sortedTournaments.length === 0) {
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
                <div className="mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                        Próximos Torneos
                    </h2>
                    <p className="text-muted-foreground">
                        Consulta los torneos programados y sus detalles
                    </p>
                </div>

                <TournamentsTable tournaments={sortedTournaments} />
            </div>
        </section>
    );
}
