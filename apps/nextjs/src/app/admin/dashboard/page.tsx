import { AdminPageLayout } from "./_components/admin-page-layout";

export default function AdminDashboardPage() {
    return (
        <AdminPageLayout
            title="Dashboard"
            description="Panel de administración"
        >
            
        <div className="space-y-6">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder cards for future metrics */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                        <p className="text-2xl font-bold">--</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Torneos Activos</p>
                        <p className="text-2xl font-bold">--</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Equipos Registrados</p>
                        <p className="text-2xl font-bold">--</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Bienvenido al panel de administración</h3>
                <p className="text-muted-foreground">
                    Desde aquí podrás gestionar torneos, usuarios y configuraciones de la plataforma.
                    Selecciona una opción del menú para comenzar.
                </p>
            </div>
        </div>

        </AdminPageLayout>
    );
}
