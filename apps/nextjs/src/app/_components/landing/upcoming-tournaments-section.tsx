import { queryClient, trpc } from '~/trpc/server';
import { Badge } from '@acme/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@acme/ui/card';
import {
    ClockIcon,
    MapPinIcon,
} from '@acme/ui/icons';

const statusLabels: Record<string, { label: string; color: string }> = {
    preliminary_open: { label: 'Preliminar abierta', color: 'bg-primary' },
    preliminary_closed: { label: 'Preliminar cerrada', color: 'bg-amber-500' },
    finished: { label: 'Finalizado', color: 'bg-muted-foreground' },
};

const divisionLabels: Record<string, string> = {
    juniors: 'Juniors',
    open: 'Open',
    masters: 'Masters',
};

const modalityLabels: Record<string, string> = {
    full: 'Full Power',
    bench: 'Bench Only',
};

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'long',
    }).format(date);
}

export default async function UpcomingTournamentsSection() {
    const events = await queryClient.fetchQuery(trpc.tournaments.publicList.queryOptions());

    // Filter only events with preliminary_open tournaments or future events
    const upcomingEvents = events.filter(e => {
        const hasOpenTournaments = e.tournaments.some(t => t.status === 'preliminary_open');
        const isFuture = new Date(e.startDate) >= new Date();
        return hasOpenTournaments || isFuture;
    }).slice(0, 6);

    if (upcomingEvents.length === 0) {
        return (
            <section
                id="torneos"
                className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                            Próximos torneos
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
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                        Próximos torneos
                    </h2>
                    <p className="text-muted-foreground">
                        Consulta los eventos programados y sus detalles
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event) => {
                        const mainStatus = event.tournaments[0]?.status ?? 'preliminary_open';
                        const statusInfo = statusLabels[mainStatus] ?? statusLabels.preliminary_open!;

                        return (
                            <Card
                                key={event.id}
                                className="border-l-4 border-primary/20 hover:shadow-lg transition overflow-hidden"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <CardTitle className="text-lg leading-tight">
                                            {event.name}
                                        </CardTitle>
                                        <Badge
                                            className={`${statusInfo.color} text-primary-foreground text-xs`}
                                        >
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPinIcon className="h-4 w-4 text-primary" />
                                        <span>{event.venue}, {event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ClockIcon className="h-4 w-4 text-primary" />
                                        <span>
                                            {formatDate(new Date(event.startDate))} - {formatDate(new Date(event.endDate))}
                                        </span>
                                    </div>

                                    {event.tournaments.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-2">
                                            {event.tournaments.slice(0, 3).map((t) => (
                                                <Badge key={t.id} variant="outline" className="text-xs">
                                                    {divisionLabels[t.division]} · {modalityLabels[t.modality]}
                                                </Badge>
                                            ))}
                                            {event.tournaments.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{event.tournaments.length - 3} más
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-border">
                                        <a
                                            href={`/eventos/${event.slug}`}
                                            className="text-primary hover:text-primary/80 font-medium text-sm"
                                        >
                                            Ver detalles →
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
