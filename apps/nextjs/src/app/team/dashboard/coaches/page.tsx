import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CoachesTable } from "./_components/coaches-table";
import { CreateCoachDialog } from "./_components/create-coach-dialog";
import { Suspense } from "react";

export default function CoachesPage() {
    void prefetch(trpc.coaches.list.queryOptions())
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Coaches"
                description="Gestión de coaches del equipo"
                actions={<CreateCoachDialog />}
            >
                <Suspense fallback={<TableSkeleton />}>
                    <CoachesTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}
