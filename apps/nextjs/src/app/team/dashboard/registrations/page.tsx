import { DashboardPageLayout } from "~/app/_components/dashboard-page-layout";
import { TableSkeleton } from "~/app/_components/skeletons";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { Suspense } from "react";
import { RegistrationsDataTable } from "./_components/registrations-table";
import Link from "next/link";
import RegisterAthelete from "./_components/register-athlete";
import { buttonVariants } from "@acme/ui/button";

export default function RegistrationsPage() {
    void prefetch(trpc.registrations.byTeam.queryOptions())
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Inscripciones"
                description="Gestión de inscripciones del equipo"
                actions={
                    <div className="flex gap-2 items-center">
                        {/* <RegisterAthelete /> */}
                        <Link href="/team/dashboard/registrations/register-team" className={buttonVariants({ variant: "default" })}>
                            Inscribir Equipo
                        </Link>
                    </div>
                }
            >
                <Suspense fallback={<TableSkeleton />}>
                    <RegistrationsDataTable />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}
