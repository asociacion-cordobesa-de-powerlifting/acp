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
import { useState } from "react"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { ChevronDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"
import { RouterOutputs } from "@acme/api"
import { ATHLETE_DIVISION, EQUIPMENT, EVENTS, TOURNAMENT_STATUS } from "@acme/shared/constants"
import { toast } from "@acme/ui/toast"
import { EyeIcon, UserPlusIcon } from "@acme/ui/icons"
import { RegisterAthleteToTournamentDialog } from "../../_components/register-athlete-dialog"

// Helper type for Tournament
type Tournament = RouterOutputs["tournaments"]["list"][number]

function TournamentActions({ tournament }: { tournament: Tournament }) {
    const [showRegisterDialog, setShowRegisterDialog] = useState(false)
    const trpc = useTRPC();
    const queryClient = useQueryClient();


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
                    <DropdownMenuItem>
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Ver inscriptos
                    </DropdownMenuItem>
                    {
                        tournament.status === 'preliminary_open' && (
                            <DropdownMenuItem onClick={() => setShowRegisterDialog(true)}>
                                <UserPlusIcon className="mr-2 h-4 w-4" />
                                Inscribir atleta
                            </DropdownMenuItem>
                        )
                    }
                </DropdownMenuContent>
            </DropdownMenu>

            <RegisterAthleteToTournamentDialog
                tournamentId={tournament.id}
                open={showRegisterDialog}
                onOpenChange={setShowRegisterDialog}
            />
        </>
    )
}

export function TournamentsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
        {
            id: "status",
            value: ["preliminary_open"],
        }
    ])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();

    const { data: tournaments = [], isLoading } = useSuspenseQuery(trpc.tournaments.list.queryOptions());

    const columns: ColumnDef<Tournament>[] = [
        {
            accessorKey: 'name',
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
            accessorKey: 'division',
            header: 'División',
            cell: ({ row }) => {
                const division = row.original.division
                const label = ATHLETE_DIVISION.find((d) => d.value === division)?.label ?? division
                return <Badge variant="secondary">{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: 'event',
            header: 'Evento',
            cell: ({ row }) => {
                const event = row.original.event
                const label = EVENTS.find((e) => e.value === event)?.label ?? event
                return <Badge variant="secondary">{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: 'equipment',
            header: 'Equipo',
            cell: ({ row }) => {
                const equipment = row.original.equipment
                const label = EQUIPMENT.find((e) => e.value === equipment)?.label ?? equipment
                return <Badge variant="secondary">{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: 'venue',
            header: 'Sede',
        },
        {
            accessorKey: 'location',
            header: 'Ubicación',
        },
        {
            accessorKey: 'startDate',
            header: 'Fecha Inicio',
            cell: ({ row }) => {
                const val = row.original.startDate
                return val ? new Date(val).toLocaleDateString() : ""
            },
        },
        {
            accessorKey: 'endDate',
            header: 'Fecha Fin',
            cell: ({ row }) => {
                const val = row.original.endDate
                return val ? new Date(val).toLocaleDateString() : ""
            },
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.original.status
                const label = TOURNAMENT_STATUS.find((s) => s.value === status)?.label ?? status
                return <Badge variant="default">{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },

        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => <TournamentActions tournament={row.original} />
        }
    ]

    const table = useReactTable({
        data: tournaments,
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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Input
                    placeholder="Buscar torneos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <DataTableFacetedFilter
                    column={table.getColumn("status")}
                    title="Estado"
                    options={TOURNAMENT_STATUS}
                />
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
                                    Cargando torneos...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
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
                                    No se encontraron torneos.
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
