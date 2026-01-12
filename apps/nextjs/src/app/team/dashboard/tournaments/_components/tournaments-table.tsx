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
} from "@acme/ui/collapsible"
import { Button } from "@acme/ui/button"
import { Input } from "@acme/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { ChevronDown, MoreHorizontal, Calendar, MapPin } from "lucide-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { RouterOutputs } from "@acme/api"
import { TOURNAMENT_DIVISION, MODALITIES, EQUIPMENT, TOURNAMENT_STATUS } from "@acme/shared/constants"
import { dayjs } from "@acme/shared/libs"
import { EyeIcon, UserPlusIcon, UsersIcon } from "@acme/ui/icons"
import Link from "next/link"

type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]
type Tournament = EventWithTournaments["tournaments"][number]

function TournamentActions({ tournament }: { tournament: Tournament }) {
    const [showRegisterDialog, setShowRegisterDialog] = useState(false)
    const [showBulkDialog, setShowBulkDialog] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Ver inscriptos
                    </DropdownMenuItem>
                    {tournament.status === 'preliminary_open' && (
                        <>
                            <DropdownMenuItem onClick={() => setShowBulkDialog(true)}>
                                <UsersIcon className="mr-2 h-4 w-4" />
                                Inscripción masiva
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* <BulkRegistrationDialog
                tournament={tournament}
                open={showBulkDialog}
                onOpenChange={setShowBulkDialog}
            /> */}
        </>
    )
}

function EventRow({
    row,
    columns
}: {
    row: any,
    columns: ColumnDef<EventWithTournaments>[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const event = row.original as EventWithTournaments
    const hasTournaments = event.tournaments && event.tournaments.length > 0

    return (
        <>
            <Collapsible
                asChild
                open={isOpen}
                onOpenChange={setIsOpen}
            >
                <TableBody className="[&_tr:last-child]:border-b">
                    <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className={hasTournaments ? "cursor-pointer" : ""}
                        onClick={() => hasTournaments && setIsOpen(!isOpen)}
                    >
                        {row.getVisibleCells().map((cell: any) => (
                            <TableCell key={cell.id}>
                                {cell.column.id === 'name' && (
                                    <div className="flex items-center gap-2">
                                        {hasTournaments && (
                                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                        )}
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        <Link
                                            href={`/team/dashboard/registrations/register-team?eventId=${event.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="outline"
                                                className="h-6 text-[9px] gap-1 px-1.5 ml-2"
                                            >
                                                <UsersIcon className="h-3 w-3" />
                                                Nómina
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                                {cell.column.id !== 'name' && flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                    {hasTournaments && (
                        <CollapsibleContent asChild>
                            <TableRow className="bg-muted/50">
                                <TableCell colSpan={columns.length} className="p-0 border-b-0">
                                    <div className="px-12 py-2 space-y-1">
                                        {event.tournaments.map((t) => {
                                            const modalityLabel = MODALITIES.find(m => m.value === t.modality)?.label ?? t.modality;
                                            const equipmentLabel = EQUIPMENT.find(e => e.value === t.equipment)?.label ?? t.equipment;
                                            const divisionLabel = TOURNAMENT_DIVISION.find(d => d.value === t.division)?.label ?? t.division;
                                            const statusLabel = TOURNAMENT_STATUS.find(s => s.value === t.status)?.label ?? t.status;

                                            return (
                                                <div
                                                    key={t.id}
                                                    className="flex items-center justify-between py-1 border-b border-dashed last:border-0"
                                                >
                                                    <div className="flex items-center gap-2 text-[11px] font-medium">
                                                        <span>{event.name}</span>
                                                        <span className="text-muted-foreground">-</span>
                                                        <span>{modalityLabel}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span>{equipmentLabel}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span>{divisionLabel}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={t.status === 'finished' ? 'secondary' : t.status === "preliminary_closed" ? "accent" : "default"}
                                                            className="text-[9px] h-4 px-1.5 uppercase tracking-wider"
                                                        >
                                                            {statusLabel}
                                                        </Badge>
                                                        {/* <TournamentActions tournament={t} /> */}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TableCell>
                            </TableRow>
                        </CollapsibleContent>
                    )}
                </TableBody>
            </Collapsible>
        </>
    )
}

export function TournamentsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();

    const { data: events = [], isLoading } = useSuspenseQuery(
        trpc.tournaments.allEvents.queryOptions()
    );

    const columns: ColumnDef<EventWithTournaments>[] = [
        {
            accessorKey: 'name',
            header: 'Evento',
            cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>
        },
        {
            accessorKey: 'venue',
            header: 'Sede/Location',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{row.original.venue}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-4">{row.original.location}</span>
                </div>
            )
        },
        {
            accessorKey: 'startDate',
            header: 'Fechas',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{dayjs(row.original.startDate).format('DD/MM')} - {dayjs(row.original.endDate).format('DD/MM/YYYY')}</span>
                </div>
            )
        },
    ]

    const table = useReactTable({
        data: events,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            globalFilter,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Input
                    placeholder="Buscar eventos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    {isLoading ? (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Cargando eventos...
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <EventRow
                                key={row.id}
                                row={row}
                                columns={columns}
                            />
                        ))
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No se encontraron eventos.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    )
}
