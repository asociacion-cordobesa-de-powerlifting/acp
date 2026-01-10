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
import { Badge } from '@acme/ui/badge';
import { Button } from '@acme/ui/button';
import { Input } from '@acme/ui/input';
import {
    ClockIcon,
    MapPinIcon,
} from '@acme/ui/icons';
import { ChevronDown, ExternalLink } from 'lucide-react';
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
    eventName: string;
    eventSlug: string;
    venue: string;
    location: string;
    startDate: Date;
    endDate: Date;
    division: string;
    modality: string;
    equipment: string;
    status: string;
}

interface TournamentsTableProps {
    tournaments: Tournament[];
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

export function TournamentsTable({ tournaments }: TournamentsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns: ColumnDef<Tournament>[] = [
        {
            accessorKey: 'eventName',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Torneo
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const t = row.original;
                const divisionLabel = getLabelFromValue(t.division, TOURNAMENT_DIVISION);
                const modalityLabel = getLabelFromValue(t.modality, MODALITIES);
                const equipmentLabel = getLabelFromValue(t.equipment, EQUIPMENT);

                return (
                    <div>
                        <Link
                            href={`/eventos/${t.eventSlug}?tournament=${t.id}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {t.eventName}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                            {divisionLabel} · {modalityLabel} · {equipmentLabel}
                        </div>
                    </div>
                );
            },
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
            accessorKey: 'division',
            header: 'División',
            cell: ({ row }) => getLabelFromValue(row.original.division, TOURNAMENT_DIVISION),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'modality',
            header: 'Modalidad',
            cell: ({ row }) => getLabelFromValue(row.original.modality, MODALITIES),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.original.status;
                const statusInfo = TOURNAMENT_STATUS.find(s => s.value === status);
                return (
                    <Badge className={`${statusColors[status] ?? 'bg-muted'} text-white`}>
                        {statusInfo?.label ?? status}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <Link href={`/eventos/${row.original.eventSlug}?tournament=${row.original.id}`}>
                    <Button variant="outline" size="sm">
                        Ver evento
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            ),
        },
    ];

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
        initialState: {
            pagination: {
                pageSize: 10,
            },
            columnVisibility: {
                division: false,
                modality: false,
            },
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    placeholder="Buscar torneos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                {table.getColumn('division') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('division')}
                        title="División"
                        options={TOURNAMENT_DIVISION}
                    />
                )}
                {table.getColumn('modality') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('modality')}
                        title="Modalidad"
                        options={MODALITIES}
                    />
                )}
                {table.getColumn('status') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('status')}
                        title="Estado"
                        options={TOURNAMENT_STATUS}
                    />
                )}
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
                    <TableBody>
                        {table.getRowModel().rows.length ? (
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
                                    No se encontraron torneos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} />
        </div>
    );
}
