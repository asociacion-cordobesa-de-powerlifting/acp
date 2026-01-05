import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { Suspense } from "react";
import { EventRegistrationsDataTable } from "./_components/event-registrations-table";
import { notFound } from "next/navigation";
import { createCaller } from "@acme/api";
import { createTRPCContext } from "@acme/api";
import { auth } from "~/auth/server";
import { headers } from "next/headers";

export default async function EventRegistrationsPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;

    // Create server caller to get event name
    const heads = new Headers(await headers());
    const ctx = await createTRPCContext({
        headers: heads,
        auth,
    });
    const caller = createCaller(ctx);
    
    // Verify event exists and get its name
    const events = await caller.tournaments.allEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) {
        notFound();
    }

    void prefetch(trpc.registrations.byEvent.queryOptions({ eventId }));

    return (
        <HydrateClient>
            <DashboardPageLayout
                title={`Inscripciones - ${event.name}`}
                description={`Todas las inscripciones de los torneos del evento ${event.name}`}
            >
                <Suspense fallback={<TableSkeleton />}>
                    <EventRegistrationsDataTable eventId={eventId} />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}

