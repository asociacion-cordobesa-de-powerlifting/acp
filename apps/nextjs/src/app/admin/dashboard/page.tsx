import { DashboardPageLayout } from "../../_components/dashboard-page-layout";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { Suspense } from "react";
import { DashboardStats } from "./_components/dashboard-stats";

export default async function AdminDashboardPage() {
    // Prefetch stats
    void prefetch(trpc.tournaments.stats.queryOptions());

    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Dashboard"
                description="Vista general del sistema"
            >
                <Suspense fallback={<DashboardStatsSkeleton />}>
                    <DashboardStats />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    );
}

function DashboardStatsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
                        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
