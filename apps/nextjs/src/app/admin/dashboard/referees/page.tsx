import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { RefereesTable } from "./_components/referees-table";
import { CreateRefereeDialog } from "./_components/create-referee-dialog";
import { Suspense } from "react";

export default function RefereesPage() {
    void prefetch(trpc.referees.list.queryOptions())
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Referees"
                description="Gestión del pool de referees"
                actions={<CreateRefereeDialog />}
            >
                <Suspense fallback={<TableSkeleton />}>
                    <RefereesTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}
