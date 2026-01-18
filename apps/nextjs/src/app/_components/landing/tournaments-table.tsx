'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@acme/ui/table';
import {
    Collapsible,
    CollapsibleContent,
} from '@acme/ui/collapsible';
import { Badge } from '@acme/ui/badge';
import { Button } from '@acme/ui/button';
import { Input } from '@acme/ui/input';
import {
    ClockIcon,
    MapPinIcon,
} from '@acme/ui/icons';
import { ChevronDown } from 'lucide-react';
import {
    getLabelFromValue,
} from '@acme/shared';
import {
    TOURNAMENT_DIVISION,
    MODALITIES,
    EQUIPMENT,
    TOURNAMENT_STATUS,
} from '@acme/shared/constants';
import { DataTableFacetedFilter } from '~/app/_components/table/faceted-filter';
import { DataTablePagination } from '~/app/_components/table/pagination';

interface Tournament {
    id: string;
    division: string;
    modality: string;
    equipment: string;
    status: string;
    slug: string;
}

interface Event {
    id: string;
    name: string;
    slug: string;
    venue: string;
    location: string;
    startDate: Date;
    endDate: Date;
    tournaments: Tournament[];
}

interface TournamentsTableProps {
    events: Event[];
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

const statusColors: Record<string, string> = {
    preliminary_open: 'bg-green-500',
    preliminary_closed: 'bg-amber-500',
    finished: 'bg-muted-foreground',
};

function EventRow({
    row,
    columns
}: {
    row: any,
    columns: ColumnDef<Event>[]
}) {
    const [isOpen, setIsOpen] = useState(false);
    const event = row.original as Event;
    const hasTournaments = event.tournaments && event.tournaments.length > 0;

    return (
        <Collapsible
            asChild
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <TableBody className="[&_tr:last-child]:border-b">
                <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={hasTournaments ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => hasTournaments && setIsOpen(!isOpen)}
                >
                    {row.getVisibleCells().map((cell: any) => (
                        <TableCell key={cell.id}>
                            {cell.column.id === 'name' && hasTournaments && (
                                <ChevronDown className={`mr-2 h-4 w-4 inline transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            )}
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                </TableRow>
                {hasTournaments && (
                    <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                            <TableCell colSpan={columns.length} className="p-0 border-b-0">
                                <div className="px-12 py-2 space-y-1">
                                    {event.tournaments.map((t) => {
                                        const modalityLabel = getLabelFromValue(t.modality, MODALITIES);
                                        const equipmentLabel = getLabelFromValue(t.equipment, EQUIPMENT);
                                        const divisionLabel = getLabelFromValue(t.division, TOURNAMENT_DIVISION);
                                        const statusLabel = TOURNAMENT_STATUS.find(s => s.value === t.status)?.label ?? t.status;
                                        const fullName = `${event.name} - ${divisionLabel} · ${modalityLabel} · ${equipmentLabel}`;

                                        return (
                                            <div
                                                key={t.id}
                                                className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0"
                                            >
                                                <Link
                                                    href={`/eventos/${event.slug}?division=${t.division}&modality=${t.modality}&equipment=${t.equipment}`}
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    {fullName}
                                                </Link>
                                                <Badge
                                                    className={`${statusColors[t.status] ?? 'bg-muted'} text-white text-xs`}
                                                >
                                                    {statusLabel}
                                                </Badge>
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
    );
}

export function TournamentsTable({ events }: TournamentsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns: ColumnDef<Event>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Evento
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-semibold">{row.original.name}</span>
            ),
        },
        {
            id: 'location',
            header: 'Ubicación',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="h-4 w-4 text-primary shrink-0" />
                    <span>{row.original.venue}, {row.original.location}</span>
                </div>
            ),
        },
        {
            accessorKey: 'startDate',
            header: 'Fechas',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-primary shrink-0" />
                    <span>
                        {formatDate(new Date(row.original.startDate))} - {formatDate(new Date(row.original.endDate))}
                    </span>
                </div>
            ),
        },
        {
            id: 'tournaments',
            header: 'Modalidades',
            cell: ({ row }) => (
                <Badge variant="outline" className="text-xs">
                    {row.original.tournaments.length} {row.original.tournaments.length === 1 ? 'modalidad' : 'modalidades'}
                </Badge>
            ),
        },
    ];

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
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    placeholder="Buscar eventos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
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
                    {table.getRowModel().rows.length ? (
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
    );
}
