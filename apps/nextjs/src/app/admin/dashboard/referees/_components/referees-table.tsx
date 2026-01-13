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
import { useState } from "react"
import { ArrowUpDown, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useTRPC } from "~/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { EditRefereeDialog } from "./edit-referee-dialog"
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
import { Badge } from "@acme/ui/badge"
import { REFEREE_CATEGORY } from "@acme/shared/constants"
import type { RouterOutputs } from "@acme/api"

type Referee = RouterOutputs["referees"]["list"][number]

function RefereeActions({ referee }: { referee: Referee }) {
    const [showEdit, setShowEdit] = useState(false)
    const [showDelete, setShowDelete] = useState(false)

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const deleteReferee = useMutation(
        trpc.referees.delete.mutationOptions({
            onSuccess: async () => {
                toast.success("Referee eliminado exitosamente")
                await queryClient.invalidateQueries(trpc.referees.list.pathFilter())
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
                    <DropdownMenuItem onClick={() => setShowEdit(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDelete(true)}
                        className="text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditRefereeDialog
                referee={referee}
                open={showEdit}
                onOpenChange={setShowEdit}
            />

            <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar referee?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará a {referee.fullName} del sistema.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteReferee.mutate({ id: referee.id })}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function RefereesTable() {
    const trpc = useTRPC()
    const { data: referees = [] } = useQuery(trpc.referees.list.queryOptions())

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")

    const columns: ColumnDef<Referee>[] = [
        {
            accessorKey: "fullName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("fullName")}</div>
            },
        },
        {
            accessorKey: "dni",
            header: "DNI",
            cell: ({ row }) => {
                return <div className="text-muted-foreground">{row.getValue("dni")}</div>
            },
        },
        {
            accessorKey: "category",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Categoría
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const category = row.getValue("category") as string
                const categoryInfo = REFEREE_CATEGORY.find(c => c.value === category)
                const colorMap: Record<string, string> = {
                    national: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    int_cat_1: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                    int_cat_2: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                }
                return (
                    <Badge className={colorMap[category] || ""} variant="secondary">
                        {categoryInfo?.label || category}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => <RefereeActions referee={row.original} />,
        },
    ]

    const table = useReactTable({
        data: referees,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar referee..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-md border">
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No hay referees registrados.
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
