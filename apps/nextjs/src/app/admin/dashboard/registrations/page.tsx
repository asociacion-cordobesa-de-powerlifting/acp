import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { Suspense } from "react";
import { RegistrationsDataTable } from "./_components/registrations-table";

export default async function AdminRegistrationsPage({
    searchParams,
}: {
    searchParams: Promise<{ eventId?: string }>;
}) {
    const params = await searchParams;
    const eventId = params.eventId;

    // Prefetch data
    void prefetch(trpc.tournaments.allEvents.queryOptions());
    void prefetch(trpc.registrations.all.queryOptions({ eventId }));

    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Inscripciones"
                description="Gestión de todas las inscripciones del sistema"
            >
                <Suspense fallback={<TableSkeleton />}>
                    <RegistrationsDataTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}

