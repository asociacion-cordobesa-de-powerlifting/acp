import Navbar from '../_components/landing/navbar';
import { Footer } from '../_components/landing/footer';
import { TorneosTable } from '../_components/landing/torneos-table';
import { queryClient, trpc } from '~/trpc/server';
import { getSession } from '~/auth/server';

export const metadata = {
    title: 'Torneos | ACP',
    description: 'Lista de todos los torneos de la Asociación Cordobesa de Powerlifting',
};

export default async function TorneosPage() {
    const session = await getSession();
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

    // Sort by date (upcoming first)
    const sortedTournaments = allTournaments
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar session={session} />

            <main className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                            Torneos
                        </h1>
                        <p className="text-muted-foreground">
                            Consulta todos los torneos programados y finalizados de la Asociación Cordobesa de Powerlifting
                        </p>
                    </div>

                    {sortedTournaments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No hay torneos disponibles en este momento.
                        </div>
                    ) : (
                        <TorneosTable tournaments={sortedTournaments} />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
