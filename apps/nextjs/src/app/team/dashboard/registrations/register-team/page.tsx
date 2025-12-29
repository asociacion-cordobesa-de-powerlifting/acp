import { BulkRegistrationForm } from './_components/bulk-registration-form'
import { Suspense } from 'react'
import { DashboardPageLayout } from '~/app/_components/dashboard-page-layout'
import { HydrateClient } from '~/trpc/server'

export default function RegisterTeamPage() {
    return (
        <HydrateClient>
            <DashboardPageLayout
                title="Inscribir Equipo"
                description="Selecciona los atletas de tu equipo para inscribirlos en un torneo."
            >
                <Suspense fallback={<div>Cargando atletas...</div>}>
                    <BulkRegistrationForm />
                </Suspense>
            </DashboardPageLayout>
        </HydrateClient>
    )
}
