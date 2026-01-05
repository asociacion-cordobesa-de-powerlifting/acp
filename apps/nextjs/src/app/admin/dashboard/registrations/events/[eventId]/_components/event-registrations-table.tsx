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
    type RowSelectionState,
} from "@tanstack/react-table"
import { useState, useRef, useEffect } from "react"
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
import { ChevronDown, MoreHorizontal } from "lucide-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"
import { RouterOutputs } from "@acme/api"
import { TOURNAMENT_STATUS, TOURNAMENT_DIVISION, WEIGHT_CLASSES, MODALITIES, ATHLETE_GENDER, REGISTRATION_STATUS, ATHLETE_DIVISION } from "@acme/shared/constants"
import { getLabelFromValue, mapTournamentDivisionToAthleteDivision } from "@acme/shared"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { UpdateRegistrationStatusDialog } from "./update-registration-status-dialog"
import { BulkUpdateStatusDialog } from "./bulk-update-status-dialog"

// Helper type for Registration with relations
type Registration = RouterOutputs["registrations"]["byEvent"][number]

// Checkbox component for row selection
function IndeterminateCheckbox({
    indeterminate,
    className = "",
    ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!)

    useEffect(() => {
        if (typeof indeterminate === "boolean") {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
    }, [ref, indeterminate, rest.checked])

    return (
        <input
            type="checkbox"
            ref={ref}
            className={`cursor-pointer ${className}`}
            {...rest}
        />
    )
}

function RegistrationActions({ registration, eventId }: { registration: Registration; eventId: string }) {
    const [showStatusDialog, setShowStatusDialog] = useState(false)

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
                    <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                        Cambiar Estado
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showStatusDialog && (
                <UpdateRegistrationStatusDialog
                    registration={registration}
                    open={showStatusDialog}
                    onOpenChange={setShowStatusDialog}
                    eventId={eventId}
                />
            )}
        </>
    )
}

export function EventRegistrationsDataTable({ eventId }: { eventId: string }) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [showBulkDialog, setShowBulkDialog] = useState(false)
    const trpc = useTRPC();

    const { data: registrations = [], isLoading } = useSuspenseQuery(
        trpc.registrations.byEvent.queryOptions({ eventId })
    );

    const columns: ColumnDef<Registration>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <IndeterminateCheckbox
                    {...{
                        checked: table.getIsAllPageRowsSelected(),
                        indeterminate: table.getIsSomePageRowsSelected(),
                        onChange: table.getToggleAllPageRowsSelectedHandler(),
                    }}
                />
            ),
            cell: ({ row }) => (
                <IndeterminateCheckbox
                    {...{
                        checked: row.getIsSelected(),
                        disabled: !row.getCanSelect(),
                        indeterminate: row.getIsSomeSelected(),
                        onChange: row.getToggleSelectedHandler(),
                    }}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'athlete.fullName',
            id: 'athleteName',
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
            accessorKey: 'team.user.name',
            id: 'teamName',
            header: 'Equipo',
            cell: ({ row }) => {
                return row.original.team.user?.name || '-'
            },
            filterFn: (row, id, value) => {
                const teamName = row.original.team.user?.name || ''
                return value.includes(teamName)
            },
        },
        {
            id: "athleteGender",
            header: "Género",
            cell: ({ row }) => {
                const genre = row.original.athlete.gender
                const label = getLabelFromValue(genre, ATHLETE_GENDER)
                return label
            },
            filterFn: (row, id, value) => {
                const genre = row.original.athlete.gender
                return value.includes(genre)
            },
        },
        {
            accessorKey: 'tournament.division',
            id: 'tournamentDivision',
            header: 'División',
            cell: ({ row }) => {
                const tournamentDivision = row.original.tournament.division
                const athleteDivision = mapTournamentDivisionToAthleteDivision(
                    tournamentDivision,
                    row.original.athlete.birthYear
                )
                const label = getLabelFromValue(athleteDivision, ATHLETE_DIVISION)
                return label
            },
            filterFn: (row, id, value) => {
                return value.includes(row.original.tournament.division)
            },
        },
        {
            accessorKey: 'weightClass',
            header: 'Categoría',
            cell: ({ row }) => {
                const weightClass = row.original.weightClass
                const label = getLabelFromValue(weightClass, WEIGHT_CLASSES)
                return label
            },
        },
        {
            accessorKey: 'tournament.modality',
            id: 'modality',
            header: 'Modalidad',
            cell: ({ row }) => {
                const modality = row.original.tournament.modality
                const label = getLabelFromValue(modality, MODALITIES)
                return label
            },
            filterFn: (row, id, value) => {
                return value.includes(row.original.tournament.modality)
            },
        },
        {
            accessorKey: 'tournament.equipment',
            id: 'equipment',
            header: 'Equipamiento',
            cell: ({ row }) => {
                const equipment = row.original.tournament.equipment
                return equipment === 'classic' ? 'Clásico' : 'Equipado'
            },
        },
        {
            accessorKey: 'tournament.status',
            id: 'tournamentStatus',
            header: 'Estado Torneo',
            cell: ({ row }) => {
                const status = row.original.tournament.status
                const label = getLabelFromValue(status, TOURNAMENT_STATUS)
                return <Badge variant="default">{label}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.original.tournament.status)
            },
        },
        {
            accessorKey: 'status',
            header: 'Estado Insc.',
            cell: ({ row }) => {
                const status = row.original.status;
                return <Badge variant={status === "pending" ? "accent" : status === "approved" ? "default" : "secondary"}>{getLabelFromValue(status, REGISTRATION_STATUS)}</Badge>
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => <RegistrationActions registration={row.original} eventId={eventId} />
        },
    ]

    const table = useReactTable({
        data: registrations,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
        },
    })

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = selectedRows.map(row => row.original.id)

    // Extract unique values for filters
    const uniqueTeams = Array.from(new Set(registrations.map(r => r.team.user?.name).filter(Boolean)))
        .map(name => ({ label: name!, value: name! }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">
                        {selectedIds.length} inscripción(es) seleccionada(s)
                    </span>
                    <Button onClick={() => setShowBulkDialog(true)} variant="default" size="sm">
                        Cambiar Estado
                    </Button>
                </div>
            )}
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
                    {/* Team Filter */}
                    {uniqueTeams.length > 0 && (
                        <DataTableFacetedFilter
                            column={table.getColumn("teamName")}
                            title="Equipos"
                            options={uniqueTeams}
                        />
                    )}

                    {/* Gender Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("athleteGender")}
                        title="Género"
                        options={ATHLETE_GENDER}
                    />

                    {/* Tournament Division Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("tournamentDivision")}
                        title="División"
                        options={TOURNAMENT_DIVISION}
                    />

                    {/* Modality Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("modality")}
                        title="Modalidad"
                        options={MODALITIES}
                    />

                    {/* Tournament Status Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("tournamentStatus")}
                        title="Estado Torneo"
                        options={TOURNAMENT_STATUS}
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
            {showBulkDialog && (
                <BulkUpdateStatusDialog
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                    selectedIds={selectedIds}
                    eventId={eventId}
                />
            )}
        </div>
    )
}

