
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
import { ChevronDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"
import { RouterOutputs } from "@acme/api"
import { TOURNAMENT_STATUS, ATHLETE_DIVISION, WEIGHT_CLASSES, EVENTS } from "@acme/shared/constants"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { toast } from "@acme/ui/toast"
import { EditRegistrationDialog } from "./edit-registration-dialog"

// Helper type for Registration with relations
type Registration = RouterOutputs["registrations"]["byTeam"][number]

function RegistrationActions({ registration }: { registration: Registration }) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const deleteRegistration = useMutation(
        trpc.registrations.delete.mutationOptions({
            onSuccess: async () => {
                toast.success("Inscripción eliminada correctamente")
                // Invalidate query
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
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
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            if (confirm("¿Estás seguro de eliminar esta inscripción?")) {
                                deleteRegistration.mutate({ id: registration.id })
                            }
                        }}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showEditDialog && (
                <EditRegistrationDialog
                    registration={registration}
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                />
            )}
        </>
    )
}

export function RegistrationsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();

    const { data: registrations = [], isLoading } = useSuspenseQuery(trpc.registrations.byTeam.queryOptions());

    const columns: ColumnDef<Registration>[] = [
        {
            accessorKey: 'athlete.fullName', // Access nested data
            id: 'athleteName', // Explicit ID for column
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Atleta
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: 'tournament.name',
            id: 'tournamentName', // Explicit ID for faceted filtering
            header: 'Torneo',
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: 'tournament.status',
            id: 'tournamentStatus',
            header: 'Estado Torneo',
            cell: ({ row }) => {
                const status = row.original.tournament.status
                const label = TOURNAMENT_STATUS.find((s) => s.value === status)?.label ?? status
                return <Badge variant={status === "draft" ? "outline" : "default"}>{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: 'division',
            header: 'División',
            cell: ({ row }) => {
                const division = row.original.division
                const label = ATHLETE_DIVISION.find((d) => d.value === division)?.label ?? division
                return label
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: 'weightClass',
            header: 'Categoría',
            cell: ({ row }) => {
                const wc = row.original.weightClass
                const label = WEIGHT_CLASSES.find((w) => w.value === wc)?.label ?? wc
                return label
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
                return label
            }
        },
        {
            accessorKey: 'squatOpenerKg',
            header: 'Sentadilla',
            cell: ({ row }) => {
                const val = row.original.squatOpenerKg;
                return val ? `${val} kg` : "-";
            },
        },
        {
            accessorKey: 'benchOpenerKg',
            header: 'Banco',
            cell: ({ row }) => {
                const val = row.original.benchOpenerKg;
                return val ? `${val} kg` : "-";
            },
        },
        {
            accessorKey: 'deadliftOpenerKg',
            header: 'Despegue',
            cell: ({ row }) => {
                const val = row.original.deadliftOpenerKg;
                return val ? `${val} kg` : "-";
            },
        },
        {
            accessorKey: 'status',
            header: 'Estado Insc.',
            cell: ({ row }) => {
                const status = row.original.status;
                return <Badge variant={status === "pending" ? "secondary" : "default"}>{status}</Badge>
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => <RegistrationActions registration={row.original} />
        }
    ]

    const table = useReactTable({
        data: registrations,
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

    // Extract unique tournaments for filter options
    const uniqueTournaments = Array.from(new Set(registrations.map(r => r.tournament.name)))
        .map(name => ({ label: name, value: name }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <Input
                    placeholder="Buscar atleta..."
                    value={(table.getColumn("athleteName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("athleteName")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <div className="flex flex-wrap gap-2">
                    {/* Tournament Filter */}
                    {uniqueTournaments.length > 0 && <DataTableFacetedFilter
                        column={table.getColumn("tournamentName")}
                        title="Torneos"
                        options={uniqueTournaments}
                    />}

                    {/* Status Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("tournamentStatus")}
                        title="Estado Torneo"
                        options={TOURNAMENT_STATUS}
                    />

                    {/* Division Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("division")}
                        title="División"
                        options={ATHLETE_DIVISION}
                    />

                    {/* Weight Class Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("weightClass")}
                        title="Categoría"
                        options={WEIGHT_CLASSES}
                    />
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
                                    Cargando inscripciones...
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
                                    No se encontraron inscripciones.
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
