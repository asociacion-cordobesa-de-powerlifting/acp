"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table"
import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@acme/ui/table"
import { Button } from "@acme/ui/button"
import { Input } from "@acme/ui/input"
import { ChevronDown, MoreHorizontal, Users2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"
import { RouterOutputs } from "@acme/api"
import { COACH_ROLE } from "@acme/shared/constants"
import { getLabelFromValue } from "@acme/shared"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { toast } from "@acme/ui/toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@acme/ui/alert-dialog"

type EventCoach = RouterOutputs["coaches"]["publicByEvent"][number]

interface EventCoachesTableProps {
    eventId: string
}

function CoachActions({ coach, eventId }: { coach: EventCoach; eventId: string }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const removeCoach = useMutation(
        trpc.coaches.adminRemoveFromEvent.mutationOptions({
            onSuccess: () => {
                toast.success("Coach eliminado del evento")
                void queryClient.invalidateQueries(trpc.coaches.publicByEvent.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                    >
                        Quitar del evento
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Quitar coach del evento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará a <strong>{coach.fullName}</strong> de este evento.
                            Esta acción se puede deshacer volviendo a registrar al coach.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => removeCoach.mutate({ registrationId: coach.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Quitar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function EventCoachesTable({ eventId }: EventCoachesTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC()

    const { data: coaches = [], isLoading } = useQuery(
        trpc.coaches.publicByEvent.queryOptions({ eventId })
    )

    const columns: ColumnDef<EventCoach>[] = [
        {
            accessorKey: 'fullName',
            id: 'fullName',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Nombre
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: 'dni',
            id: 'dni',
            header: 'DNI',
        },
        {
            accessorKey: 'role',
            id: 'role',
            header: 'Rol',
            cell: ({ row }) => {
                const role = row.original.role
                const label = getLabelFromValue(role, [...COACH_ROLE])
                return <Badge variant="outline">{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.original.role)
            },
        },
        {
            accessorKey: 'teamSlug',
            id: 'teamSlug',
            header: 'Equipo',
            filterFn: (row, id, value) => {
                return value.includes(row.original.teamSlug)
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => <CoachActions coach={row.original} eventId={eventId} />
        },
    ]

    const table = useReactTable({
        data: coaches,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    })

    // Extract unique teams for filter
    const uniqueTeams = useMemo(() => {
        return Array.from(new Set(coaches.map(c => c.teamSlug)))
            .map(slug => ({ label: slug, value: slug }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [coaches])

    if (coaches.length === 0 && !isLoading) {
        return null
    }

    return (
        <div className="space-y-4 mt-8 pt-8 border-t">
            <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Coaches del Evento</h3>
                <Badge variant="secondary">{coaches.length}</Badge>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Buscar coach..."
                        value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("fullName")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Role Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("role")}
                        title="Rol"
                        options={[...COACH_ROLE]}
                    />

                    {/* Team Filter */}
                    {uniqueTeams.length > 0 && (
                        <DataTableFacetedFilter
                            column={table.getColumn("teamSlug")}
                            title="Equipo"
                            options={uniqueTeams}
                        />
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Cargando coaches...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No hay coaches registrados en este evento.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    )
}
