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

const upcomingTournaments = [
    {
        id: 1,
        name: 'Campeonato Provincial 2025',
        location: 'Centro de Convenciones, Córdoba',
        startDate: '15 de Febrero',
        endDate: '16 de Febrero',
        status: 'Preliminar abierta',
        statusColor: 'bg-primary',
    },
    {
        id: 2,
        name: 'Torneo Clasificatorio Nacional',
        location: 'Estadio Municipal, Córdoba',
        startDate: '20 de Marzo',
        endDate: '21 de Marzo',
        status: 'Próximamente',
        statusColor: 'bg-secondary',
    },
    {
        id: 3,
        name: 'Abierto de Powerlifting Junior',
        location: 'Polideportivo Regional',
        startDate: '10 de Abril',
        endDate: '12 de Abril',
        status: 'Próximamente',
        statusColor: 'bg-muted-foreground',
    },
];

export default function UpcomingTournamentsSection() {
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
                    {upcomingTournaments.map((tournament) => (
                        <Card
                            key={tournament.id}
                            className="border-l-4 border-primary/20 hover:shadow-lg transition overflow-hidden"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <CardTitle className="text-lg leading-tight">
                                        {tournament.name}
                                    </CardTitle>
                                    <Badge
                                        className={`${tournament.statusColor} text-primary-foreground text-xs`}
                                    >
                                        {tournament.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPinIcon className="h-4 w-4 text-primary" />
                                    <span>{tournament.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ClockIcon className="h-4 w-4 text-primary" />
                                    <span>
                                        {tournament.startDate} - {tournament.endDate}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <a
                                        href={`/torneos/${tournament.id}`}
                                        className="text-primary hover:text-primary/80 font-medium text-sm"
                                    >
                                        Ver detalles →
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
