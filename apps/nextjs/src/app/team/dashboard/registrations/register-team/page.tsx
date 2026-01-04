import { TeamRegistrationView } from './_components/team-registration-view'
import { Suspense } from 'react'
import { DashboardPageLayout } from '~/app/_components/dashboard-page-layout'
import { HydrateClient } from '~/trpc/server'

export default function RegisterTeamPage() {
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Suscripción por Equipo"
                description="Gestiona la nómina completa de tu equipo para un evento específico."
            >
                <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Cargando...</div>}>
                    <TeamRegistrationView />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    )
}
