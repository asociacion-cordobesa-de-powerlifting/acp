import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AthletesTable } from "./_components/athletes-table";
import { CreateAthleteDialog } from "./_components/create-athlete-dialog";
import { ImportAthletesDialog } from "./_components/import-athletes-dialog";
import { Suspense } from "react";

export default function AthletesPage() {
    void prefetch(trpc.athletes.list.queryOptions())
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Atletas"
                description="Gestión de atletas"
                actions={
                    <div className="flex gap-2">
                        <ImportAthletesDialog />
                        <CreateAthleteDialog />
                    </div>
                }
            >
                <Suspense fallback={<TableSkeleton />}>
                    <AthletesTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}

