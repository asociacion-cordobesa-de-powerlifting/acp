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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@acme/ui/collapsible"
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
import { TOURNAMENT_STATUS, ATHLETE_DIVISION, EVENTS, EQUIPMENT } from "@acme/shared/constants"
import { dayjs } from "@acme/shared/libs"
import { EditTournamentDialog } from "./edit-tournament-dialog"
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

// Helper type for Tournament with subEvents (from all query)
type Tournament = RouterOutputs["tournaments"]["all"][number]

function TournamentRow({
    row,
    columns
}: {
    row: any,
    columns: ColumnDef<Tournament>[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const tournament = row.original as any
    const hasSubEvents = tournament.subEvents && tournament.subEvents.length > 0

    return (
        <Collapsible
            asChild
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <>
                <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={hasSubEvents ? "cursor-pointer" : ""}
                    onClick={() => hasSubEvents && setIsOpen(!isOpen)}
                >
                    {row.getVisibleCells().map((cell: any) => (
                        <TableCell key={cell.id}>
                            {cell.column.id === 'name' && hasSubEvents && (
                                <ChevronDown className={`mr-2 h-4 w-4 inline transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            )}
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                </TableRow>
                {hasSubEvents && (
                    <CollapsibleContent asChild>
                        <TableRow className="bg-muted/50">
                            <TableCell colSpan={columns.length} className="p-0">
                                <div className="p-4 pl-12 space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground">Modalidades / Instancias</h4>
                                        <Badge variant="secondary" className="text-[10px]">
                                            {tournament.subEvents?.length} instancias
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {(tournament.subEvents as any[])?.map((sub: any) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between p-2 rounded-md border bg-background text-sm"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{sub.equipment} - {sub.event}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {ATHLETE_DIVISION.find(d => d.value === sub.division)?.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={sub.status === 'finished' ? 'secondary' : 'default'} className="text-[10px]">
                                                        {sub.status}
                                                    </Badge>
                                                    <TournamentActions tournament={sub} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    </CollapsibleContent>
                )}
            </>
        </Collapsible>
    )
}

function TournamentActions({ tournament }: { tournament: Tournament }) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [openEdit, setOpenEdit] = useState(false)
    const [openDelete, setOpenDelete] = useState(false)

    const deleteTournament = useMutation(
        trpc.tournaments.delete.mutationOptions({
            onSuccess: async () => {
                toast.success("Torneo eliminado exitosamente")
                await queryClient.invalidateQueries(trpc.tournaments.list.pathFilter())
                setOpenDelete(false)
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    return (
        <>
            <EditTournamentDialog
                open={openEdit}
                onOpenChange={setOpenEdit}
                tournament={tournament}
            />
            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar este torneo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el torneo "{tournament.name}" y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTournament.mutate({ id: tournament.id })}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteTournament.isPending}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setOpenEdit(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setOpenDelete(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}

export function TournamentsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();

    const { data: tournaments = [], isLoading } = useSuspenseQuery(
        trpc.tournaments.all.queryOptions({
            onlyRoots: true,
            includeSubEvents: true
        })
    );

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
                return val ? dayjs(val).format('DD/MM/YYYY') : ""
            },
        },
        {
            accessorKey: 'endDate',
            header: 'Fecha Fin',
            cell: ({ row }) => {
                const val = row.original.endDate
                return val ? dayjs(val).format('DD/MM/YYYY') : ""
            },
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.original.status
                const label = TOURNAMENT_STATUS.find((s) => s.value === status)?.label ?? status
                return <p>{label}</p>
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
                                <TournamentRow
                                    key={row.id}
                                    row={row}
                                    columns={columns}
                                />
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
