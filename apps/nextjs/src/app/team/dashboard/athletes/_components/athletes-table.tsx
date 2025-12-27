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
import { ChevronDown, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react"
import { useQueryClient, useSuspenseQuery, useMutation } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"
import { RouterOutputs } from "@acme/api"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { ATHLETE_DIVISION } from "@acme/shared/constants"
import { getAthleteDivision } from "@acme/shared"
import { EditAthleteDialog } from "./edit-athlete-dialog"
import { RegisterAthleteToTournamentDialog } from "../../_components/register-athlete-dialog"
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
import { toast } from "@acme/ui/toast"

// Helper type for Athlete
type Athlete = RouterOutputs["athletes"]["list"][number]

const GENDER_OPTIONS = [
    { label: "Masculino", value: "M" },
    { label: "Femenino", value: "F" },
]

function AthleteActions({ athlete }: { athlete: Athlete }) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showRegisterDialog, setShowRegisterDialog] = useState(false)
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const deleteAthlete = useMutation(
        trpc.athletes.delete.mutationOptions({
            onSuccess: async () => {
                toast.success("Atleta eliminado exitosamente")
                setShowDeleteDialog(false)
                await queryClient.invalidateQueries(trpc.athletes.list.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    return (
        <>
            <EditAthleteDialog
                athlete={athlete}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />
            <RegisterAthleteToTournamentDialog
                athleteId={athlete.id}
                open={showRegisterDialog}
                onOpenChange={setShowRegisterDialog}
            />
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al atleta
                            <span className="font-medium text-foreground"> {athlete.fullName} </span>
                            de su equipo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                deleteAthlete.mutate({ id: athlete.id })
                            }}
                            className="bg-red-600 focus:ring-red-600"
                        >
                            {deleteAthlete.isPending ? "Eliminando..." : "Eliminar"}
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
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowRegisterDialog(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Inscribir a torneo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
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

export function AthletesTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();

    const { data: athletes = [], isLoading } = useSuspenseQuery(trpc.athletes.list.queryOptions());

    const columns: ColumnDef<Athlete>[] = [
        {
            accessorKey: 'fullName',
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
            header: 'DNI',
        },
        {
            accessorKey: 'birthYear',
            header: 'Año de nacimiento',
        },
        {
            accessorKey: 'birthYear',
            id: 'division',
            header: 'División',
            cell: ({ row }) => {
                const year = row.original.birthYear;
                const currentYear = new Date().getFullYear();
                const age = currentYear - year;
                if (!year) return "-";
                // We likely need to map the display label here if the divisionKey is the value
                // Checking constants.ts, ATHLETE_DIVISION is an array of objects { label, value }
                // We need to find the label corresponding to the value returned by getAthleteDivision(year)
                const divisionKey = getAthleteDivision(year);
                const division = ATHLETE_DIVISION.find(d => d.value === divisionKey);
                return `
                ${division ? division.label : divisionKey} (${age})
                `
            },
            filterFn: (row, id, value) => {
                // The value here is likely the division key (e.g. 'open')
                // We need to check if the row's computed division matches any of the selected values
                const year = row.original.birthYear;
                if (!year) return false;
                const divisionKey = getAthleteDivision(year);
                return value.includes(divisionKey);
            },
        },
        {
            accessorKey: 'gender',
            header: 'Género',
            cell: ({ row }) => {
                const gender = row.original.gender;
                return (gender === "M" ? "Masculino" : "Femenino")
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => <AthleteActions athlete={row.original} />
        }
    ]

    const table = useReactTable({
        data: athletes,
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
                    placeholder="Buscar atletas..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                {table.getColumn("gender") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("gender")}
                        title="Género"
                        options={GENDER_OPTIONS}
                    />
                )}
                {table.getColumn("division") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("division")}
                        title="División"
                        options={ATHLETE_DIVISION}
                    />
                )}
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
                                    Cargando atletas...
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
                                    No se encontraron atletas.
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
