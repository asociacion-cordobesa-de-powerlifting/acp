import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AthletesTable } from "./_components/athletes-table";
import { CreateAthleteDialog } from "./_components/create-athlete-dialog";
import { Suspense } from "react";

export default function AthletesPage() {
    void prefetch(trpc.athletes.list.queryOptions())
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Atletas"
                description="Gestión de atletas"
                actions={<CreateAthleteDialog />}
            >
                <Suspense fallback={<TableSkeleton />}>
                    <AthletesTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}
