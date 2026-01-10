import { queryClient, trpc } from '~/trpc/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge } from '@acme/ui/badge';
import {
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
} from '@acme/ui/icons';
import { Download } from 'lucide-react';
import {
    getLabelFromValue,
} from '@acme/shared';
import {
    TOURNAMENT_DIVISION,
    MODALITIES,
    EQUIPMENT,
    TOURNAMENT_STATUS,
} from '@acme/shared/constants';
import Link from 'next/link';
import Navbar from '~/app/_components/landing/navbar';
import { Footer } from '~/app/_components/landing/footer';
import { RegistrationsTable } from './_components/registrations-table';
import { getSession } from '~/auth/server';

interface EventPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ tournament?: string }>;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const data = await queryClient.fetchQuery(
            trpc.registrations.publicByEventSlug.queryOptions({ slug })
        );
        return {
            title: `${data.event.name}`,
            description: `Información y atletas registrados para ${data.event.name}. ${data.event.venue}, ${data.event.location}.`,
            openGraph: {
                title: data.event.name,
                description: `Torneo de powerlifting en ${data.event.venue}, ${data.event.location}`,
            },
        };
    } catch {
        return {
            title: 'Evento no encontrado',
        };
    }
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
    const { slug } = await params;
    const session = await getSession();

    let data;
    try {
        data = await queryClient.fetchQuery(
            trpc.registrations.publicByEventSlug.queryOptions({ slug })
        );
    } catch {
        notFound();
    }

    const { event, registrations } = data;

    const statusColors: Record<string, string> = {
        preliminary_open: 'bg-green-500',
        preliminary_closed: 'bg-amber-500',
        finished: 'bg-muted-foreground',
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar session={session} />

            {/* Hero Banner with Image */}
            <section className="relative h-[40vh] min-h-[400px] flex items-end">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('/event-detail.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'top',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60" />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />

                {/* Content */}
                <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pb-12">
                    <div className="max-w-6xl mx-auto">
                        <Link
                            href="/#torneos"
                            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition mb-4"
                        >
                            ← Volver a torneos
                        </Link>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                            {event.name}
                        </h1>

                        <div className="flex flex-wrap gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="h-5 w-5" />
                                <span>{event.venue}, {event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                <span>
                                    {formatShortDate(new Date(event.startDate))} - {formatShortDate(new Date(event.endDate))}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UsersIcon className="h-5 w-5" />
                                <span>{registrations.length} atletas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tournaments/Modalities Section */}
            <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-border bg-muted/30">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Modalidades del Evento</h2>
                        {event.resultsUrl && (
                            <a
                                href={event.resultsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium text-sm"
                            >
                                <Download className="h-4 w-4" />
                                Descargar Resultados
                            </a>
                        )}
                    </div>
                    {/* Ticker container with gradient masks */}
                    <div className="relative overflow-hidden">
                        {/* Left gradient mask */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
                        {/* Right gradient mask */}
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

                        {/* Ticker animation */}
                        <div className="flex animate-ticker hover:paused">
                            {/* First set */}
                            {event.tournaments.map(t => {
                                const statusInfo = TOURNAMENT_STATUS.find(s => s.value === t.status);
                                const filterParams = new URLSearchParams({
                                    division: t.division,
                                    modality: t.modality,
                                    equipment: t.equipment,
                                });
                                return (
                                    <Link
                                        key={`first-${t.id}`}
                                        href={`?${filterParams.toString()}`}
                                        scroll={false}
                                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 mx-2 rounded-full border border-border bg-card hover:bg-muted transition cursor-pointer"
                                    >
                                        <span className="text-sm font-medium whitespace-nowrap">
                                            {getLabelFromValue(t.division, TOURNAMENT_DIVISION)} · {getLabelFromValue(t.modality, MODALITIES)} · {getLabelFromValue(t.equipment, EQUIPMENT)}
                                        </span>
                                        <Badge className={`${statusColors[t.status] ?? 'bg-muted'} text-white text-xs`}>
                                            {statusInfo?.label ?? t.status}
                                        </Badge>
                                    </Link>
                                );
                            })}
                            {/* Duplicate set for seamless loop */}
                            {event.tournaments.map(t => {
                                const statusInfo = TOURNAMENT_STATUS.find(s => s.value === t.status);
                                const filterParams = new URLSearchParams({
                                    division: t.division,
                                    modality: t.modality,
                                    equipment: t.equipment,
                                });
                                return (
                                    <Link
                                        key={`second-${t.id}`}
                                        href={`?${filterParams.toString()}`}
                                        scroll={false}
                                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 mx-2 rounded-full border border-border bg-card hover:bg-muted transition cursor-pointer"
                                    >
                                        <span className="text-sm font-medium whitespace-nowrap">
                                            {getLabelFromValue(t.division, TOURNAMENT_DIVISION)} · {getLabelFromValue(t.modality, MODALITIES)} · {getLabelFromValue(t.equipment, EQUIPMENT)}
                                        </span>
                                        <Badge className={`${statusColors[t.status] ?? 'bg-muted'} text-white text-xs`}>
                                            {statusInfo?.label ?? t.status}
                                        </Badge>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Registrations Section */}
            <section className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Atletas Registrados
                        </h2>
                        <p className="text-muted-foreground">
                            {registrations.length} atletas
                        </p>
                    </div>

                    {registrations.length > 0 ? (
                        <RegistrationsTable
                            registrations={registrations}
                            availableTournaments={event.tournaments}
                        />
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
                            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>No hay atletas registrados con inscripción aprobada.</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
