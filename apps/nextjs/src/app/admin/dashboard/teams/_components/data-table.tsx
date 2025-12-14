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
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Ban } from "lucide-react"
import { toast } from "@acme/ui/toast"
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar"
import { Badge } from "@acme/ui/badge"
import { authClient } from "~/auth/client"
import { useTRPC } from "~/trpc/react"

// Define Team type (based on user schema)
type Team = {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    role?: string | null;
    banned?: boolean | null;
}

export function TeamsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data: teams = [], isLoading } = useSuspenseQuery(trpc.teams.list.queryOptions());

    const banUser = useMutation({ // TODO: Implement ban via tRPC or keep using authClient if comfortable
        // Actually, let's keep using authClient for actions if simpler, or implement tRPC mutation.
        // authClient is fine for client-side actions if the user ID is known.
    } as any);

    // Using authClient for ban/delete actions directly for now, wrapping in a function
    const handleBanUser = async (userId: string) => {
        const { error } = await authClient.admin.banUser({ userId });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Equipo baneado correctamente");
            void queryClient.invalidateQueries(trpc.teams.list.pathFilter());
        }
    };


    // Define columns
    const columns: ColumnDef<Team>[] = [
        {
            id: "avatar",
            header: "",
            cell: ({ row }) => {
                const team = row.original
                const name = team.name || 'Equipo'
                const image = team.image

                return (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={image || undefined} alt={name} />
                        <AvatarFallback>
                            {name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )
            },
        },
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
            accessorKey: 'email',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Email
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: 'banned',
            header: 'Estado',
            cell: ({ row }) => {
                return row.original.banned ? <Badge variant="destructive">Baneado</Badge> : <Badge variant="outline">Activo</Badge>
            }
        },
        {
            accessorKey: 'createdAt',
            header: 'Fecha Registro',
            cell: ({ row }) => {
                return new Date(row.original.createdAt).toLocaleDateString()
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const team = row.original;
                const isBanned = team.banned;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    if (confirm('¿Estás seguro de banear a este equipo?')) {
                                        void handleBanUser(team.id);
                                    }
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                {isBanned ? 'Desbanear' : 'Banear (Bloquear acceso)'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]

    const table = useReactTable({
        data: teams,
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
                    placeholder="Buscar equipos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
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
                                    Cargando equipos...
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
                                    No se encontraron equipos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Página {table.getState().pagination.pageIndex + 1} de{" "}
                    {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm mx-2">
                        {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
