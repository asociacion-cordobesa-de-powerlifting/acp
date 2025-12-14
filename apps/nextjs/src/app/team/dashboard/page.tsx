import { HydrateClient } from "~/trpc/server";

export default function TeamDashboardPage() {
    return (
        <HydrateClient>
            <div className="container py-10">
                <h1 className="text-3xl font-bold mb-6">Panel de Equipo</h1>
                <div className="p-6 border rounded-lg bg-card">
                    <p className="text-muted-foreground">Bienvenido al panel de control de tu equipo.</p>
                </div>
            </div>
        </HydrateClient>
    );
}
