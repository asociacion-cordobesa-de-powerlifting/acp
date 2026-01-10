'use client';

import { useState, useMemo } from 'react';
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
import { ChevronDown } from 'lucide-react';
import {
    getLabelFromValue,
} from '@acme/shared';
import {
    TOURNAMENT_DIVISION,
    MODALITIES,
    EQUIPMENT,
    WEIGHT_CLASSES,
    ATHLETE_GENDER,
} from '@acme/shared/constants';
import { DataTableFacetedFilter } from '~/app/_components/table/faceted-filter';
import { DataTablePagination } from '~/app/_components/table/pagination';

interface Registration {
    id: string;
    tournamentId: string;
    weightClass: string;
    tournament: {
        id: string;
        division: string;
        modality: string;
        equipment: string;
        status: string;
    };
    athlete: {
        id: string;
        fullName: string;
        birthYear: number;
        gender: string;
    };
    teamName: string;
}

interface RegistrationsTableProps {
    registrations: Registration[];
}

export function RegistrationsTable({ registrations }: RegistrationsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Extract unique teams for filter
    const uniqueTeams = useMemo(() => {
        return Array.from(new Set(registrations.map(r => r.teamName)))
            .map(name => ({ label: name, value: name }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [registrations]);

    const columns: ColumnDef<Registration>[] = [
        {
            accessorKey: 'athlete.fullName',
            id: 'athleteName',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Atleta
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.athlete.fullName}</span>
            ),
        },
        {
            accessorKey: 'teamName',
            id: 'teamName',
            header: 'Equipo',
            filterFn: (row, id, value) => value.includes(row.original.teamName),
        },
        {
            accessorKey: 'athlete.gender',
            id: 'athleteGender',
            header: 'Género',
            cell: ({ row }) => {
                const gender = row.original.athlete.gender;
                return (
                    <Badge variant={gender === 'M' ? 'default' : 'secondary'}>
                        {getLabelFromValue(gender, ATHLETE_GENDER)}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => value.includes(row.original.athlete.gender),
        },
        {
            accessorKey: 'weightClass',
            id: 'weightClass',
            header: 'Categoría',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {getLabelFromValue(row.original.weightClass, WEIGHT_CLASSES)}
                </Badge>
            ),
        },
        {
            accessorKey: 'tournament.division',
            id: 'division',
            header: 'División',
            cell: ({ row }) => getLabelFromValue(row.original.tournament.division, TOURNAMENT_DIVISION),
            filterFn: (row, id, value) => value.includes(row.original.tournament.division),
        },
        {
            accessorKey: 'tournament.modality',
            id: 'modality',
            header: 'Modalidad',
            cell: ({ row }) => getLabelFromValue(row.original.tournament.modality, MODALITIES),
            filterFn: (row, id, value) => value.includes(row.original.tournament.modality),
        },
        {
            accessorKey: 'tournament.equipment',
            id: 'equipment',
            header: 'Equipo',
            cell: ({ row }) => getLabelFromValue(row.original.tournament.equipment, EQUIPMENT),
            filterFn: (row, id, value) => value.includes(row.original.tournament.equipment),
        },
    ];

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
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Buscar atleta..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {uniqueTeams.length > 1 && (
                        <DataTableFacetedFilter
                            column={table.getColumn('teamName')}
                            title="Equipo"
                            options={uniqueTeams}
                        />
                    )}
                    <DataTableFacetedFilter
                        column={table.getColumn('athleteGender')}
                        title="Género"
                        options={ATHLETE_GENDER}
                    />
                    <DataTableFacetedFilter
                        column={table.getColumn('division')}
                        title="División"
                        options={TOURNAMENT_DIVISION}
                    />
                    <DataTableFacetedFilter
                        column={table.getColumn('modality')}
                        title="Modalidad"
                        options={MODALITIES}
                    />
                    <DataTableFacetedFilter
                        column={table.getColumn('equipment')}
                        title="Equipamiento"
                        options={EQUIPMENT}
                    />
                </div>
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
                                    No se encontraron atletas registrados.
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
