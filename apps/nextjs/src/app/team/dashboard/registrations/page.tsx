import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient } from "~/trpc/server";
import { Suspense } from "react";

export default function RegistrationsPage() {
    return (
        <HydrateClient>

            <DashboardPageLayout
                title="Inscripciones"
                description="Gestión de inscripciones"
            >
                <Suspense fallback={<TableSkeleton />}>
                    INSCRIPCIONES
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}
