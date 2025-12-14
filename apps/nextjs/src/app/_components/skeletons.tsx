'use client'

import { Skeleton } from "@acme/ui/skeleton"
import { cn } from "@acme/ui"
import { SidebarContent, SidebarFooter, SidebarHeader } from "@acme/ui/sidebar"

// Tarjeta simple con título, descripción y acciones
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center pt-4">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}

// Grid de tarjetas para listados
export function CardGridSkeleton({ count = 4, column }: { count?: number, column?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-3 w-full ${column && 'flex-col'}`}>
      {Array(count)
        .fill(null)
        .map((_, index) => (
          <CardSkeleton key={index} />
        ))}
    </div>
  )
}

// Encabezado de página con título y descripción
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 pb-4 pt-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  )
}

// Tabla para listados de datos
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <div className="bg-muted/50 px-4 py-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-[250px]" />
        </div>
      </div>
      <div className="divide-y">
        {Array(rows)
          .fill(null)
          .map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center p-4">
              {Array(cols)
                .fill(null)
                .map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 px-2">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
            </div>
          ))}
      </div>
    </div>
  )
}

// Perfil de usuario con avatar y detalles
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2 text-center sm:text-left">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
        <div className="flex items-center justify-center space-x-2 sm:justify-start">
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}

// Formulario con varios campos
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array(fields)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      <Skeleton className="h-10 w-full max-w-[180px] rounded-md" />
    </div>
  )
}

// Dashboard con stats
export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-3">
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="mt-2">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
    </div>
  )
}

// Sidebar de navegación
export function SidebarSkeleton({ items = 6 }: { items?: number }) {

  return (
    <>
      <SidebarHeader>
        <Skeleton className="h-12 w-full rounded-md" />
      </SidebarHeader>

      <SidebarContent>
        {Array(items)
          .fill(null)
          .map((_, index) => (
            <Skeleton key={index} className="h-6 w-3/4 rounded-md" />
          ))}
      </SidebarContent>

      <SidebarFooter>
        {Array(2)
          .fill(null)
          .map((_, index) => (
            <Skeleton key={index} className="h-6 w-3/4 rounded-md" />
          ))}
        <Skeleton className="h-12 w-full rounded-md" />
      </SidebarFooter>
    </>
  )
}

// Comentarios o mensajes
export function CommentsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="flex space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
    </div>
  )
}

// Elemento de lista con imagen
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array(count)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
    </div>
  )
}

// Paginación
export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-24 rounded-md" />
      <div className="flex items-center space-x-2">
        {Array(3)
          .fill(null)
          .map((_, index) => (
            <Skeleton key={index} className="h-9 w-9 rounded-md" />
          ))}
      </div>
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
  )
}

// Loading page completo para uso en loading.tsx
export function LoadingPage() {
  return (
    <div className="container space-y-8 py-8">
      <PageHeaderSkeleton />
      <DashboardStatsSkeleton />
      <div className="mt-8">
        <TableSkeleton />
      </div>
    </div>
  )
}

export function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <div className="border-b bg-muted/40 p-4">
          <div className="grid grid-cols-6 gap-4 font-medium text-muted-foreground">
            <div className="w-8"></div>
            <div>Nombre</div>
            <div>Email</div>
            <div>Estado</div>
            <div>Fecha Registro</div>
            <div className="text-right">Acciones</div>
          </div>
        </div>
        <div className="divide-y">
          {Array(5)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="flex items-center p-4">
                {/* Avatar */}
                <div className="mr-4 w-12">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>

                {/* Name */}
                <div className="flex-1 pr-4">
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Email */}
                <div className="flex-1 pr-4">
                  <Skeleton className="h-4 w-40" />
                </div>

                {/* Status */}
                <div className="w-24 pr-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                {/* Date */}
                <div className="w-32 pr-4">
                  <Skeleton className="h-4 w-24" />
                </div>

                {/* Actions */}
                <div className="w-12 flex justify-end">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Pagination */}
      <PaginationSkeleton />
    </div>
  )
}
