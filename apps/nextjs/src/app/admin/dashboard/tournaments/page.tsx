import React from 'react'
import { AdminPageLayout } from '../_components/admin-page-layout'
import { HydrateClient, prefetch, trpc } from '~/trpc/server'

export default function TournamentsPage() {
  void prefetch(trpc.tournaments.list.queryOptions())
  return (
    <HydrateClient>
      <AdminPageLayout
        title="Torneos"
        description="Gestión de torneos"
      >
        datatable
      </AdminPageLayout>
    </HydrateClient>
  )
}
