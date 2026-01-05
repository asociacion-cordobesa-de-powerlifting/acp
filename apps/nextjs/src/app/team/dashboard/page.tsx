import { DashboardPageLayout } from "../../_components/dashboard-page-layout";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { Suspense } from "react";
import { TeamDashboardStats } from "./_components/team-dashboard-stats";

export default async function TeamDashboardPage() {
    // Prefetch stats
    void prefetch(trpc.registrations.teamStats.queryOptions());

    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Dashboard"
                description="Vista general de tu equipo"
            >
                <Suspense fallback={<TeamDashboardStatsSkeleton />}>
                    <TeamDashboardStats />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}

function TeamDashboardStatsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
                        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
