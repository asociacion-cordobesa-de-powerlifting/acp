import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { DashboardPageLayout } from "../../../_components/dashboard-page-layout";
import { AdminAthletesTable } from "./_components/admin-athletes-table";
import { TableSkeleton } from "~/app/_components/skeletons";
import { Suspense } from "react";

export default function AdminAthletesPage() {

    void prefetch(trpc.athletes.listAll.queryOptions())
    void prefetch(trpc.teams.listWithTeamData.queryOptions())

    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Atletas"
                description="Gestión de todos los atletas del sistema"
            >
                <Suspense fallback={<TableSkeleton />}>
                    <AdminAthletesTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}
