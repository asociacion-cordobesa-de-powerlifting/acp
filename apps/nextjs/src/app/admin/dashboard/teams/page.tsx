import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AdminPageLayout } from "../_components/admin-page-layout";
import { CreateTeamDialog } from "./_components/create-team-dialog";
import { TeamsDataTable } from "./_components/data-table";
import { TableSkeleton } from "~/app/_components/skeletons";
import { Suspense } from "react";

export default function TeamsPage() {

    void prefetch(trpc.teams.list.queryOptions())

    return (
        <HydrateClient>
            <AdminPageLayout
                title="Equipos"
                description="Gestión de equipos y cuentas de usuario"
                actions={<CreateTeamDialog />}
            >
                <Suspense fallback={<TableSkeleton />}>
                    <TeamsDataTable />
                </Suspense>
            </AdminPageLayout>
        </HydrateClient>
    );
}
