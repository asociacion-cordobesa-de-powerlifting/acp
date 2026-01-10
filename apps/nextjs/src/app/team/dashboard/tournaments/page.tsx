import React, { Suspense } from 'react'
import { DashboardPageLayout } from '../../../_components/dashboard-page-layout'
import { HydrateClient, prefetch, trpc } from '~/trpc/server'
import { TableSkeleton } from '~/app/_components/skeletons'
import { TournamentsDataTable } from './_components/tournaments-table'

export default function TournamentsPage() {
  void prefetch(trpc.tournaments.allEvents.queryOptions())
  return (
    <HydrateClient>
      <DashboardPageLayout
        title="Torneos"
        description="Gestión de torneos"
      // actions={<CreateTournamentDialog />}
      >
        <Suspense fallback={<TableSkeleton />}>
          <TournamentsDataTable />
        </Suspense>
      </DashboardPageLayout>
    </HydrateClient>
  )
}
