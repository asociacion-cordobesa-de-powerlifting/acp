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
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Ban, Pencil } from "lucide-react"
import { toast } from "@acme/ui/toast"
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar"
import { Badge } from "@acme/ui/badge"
import { authClient } from "~/auth/client"
import { useTRPC } from "~/trpc/react"
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
import { EditTeamDialog } from "./edit-team-dialog"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"

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

function TeamActions({ team }: { team: Team }) {
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const handleBanUser = async () => {
        const { error } = await authClient.admin.banUser({ userId: team.id });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success(team.banned ? "Equipo desbaneado correctamente" : "Equipo baneado correctamente");
            void queryClient.invalidateQueries(trpc.teams.list.pathFilter());
        }
    };

    const handleDeleteUser = async () => {
        const { error } = await authClient.admin.removeUser({ userId: team.id });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Equipo eliminado correctamente");
            void queryClient.invalidateQueries(trpc.teams.list.pathFilter());
        }
    };

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
                    <DropdownMenuItem
                        onClick={() => setIsEditDialogOpen(true)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsBanDialogOpen(true)}
                        className="text-amber-600 focus:text-amber-600"
                    >
                        <Ban className="mr-2 h-4 w-4" />
                        {team.banned ? 'Desbanear' : 'Banear (Bloquear acceso)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar equipo
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <EditTeamDialog
                team={team}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />

            {/* Ban/Unban Dialog */}
            <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿{team.banned ? 'Desbanear' : 'Banear'} a este equipo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {team.banned
                                ? "El equipo recuperará el acceso a la plataforma."
                                : "El equipo perderá el acceso a la plataforma hasta que sea desbaneado."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            void handleBanUser();
                            setIsBanDialogOpen(false);
                        }}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar este equipo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta del equipo "{team.name}" y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                void handleDeleteUser();
                                setIsDeleteDialogOpen(false);
                            }}
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

export function TeamsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const trpc = useTRPC();

    const { data: teams = [], isLoading } = useSuspenseQuery(trpc.teams.list.queryOptions());

    // Define columns
    const columns: ColumnDef<Team>[] = [
        // {
        //     id: "avatar",
        //     header: "",
        //     cell: ({ row }) => {
        //         const team = row.original
        //         const name = team.name || 'Equipo'
        //         const image = team.image

        //         return (
        //             <Avatar className="h-8 w-8">
        //                 <AvatarImage src={image || undefined} alt={name} />
        //                 <AvatarFallback>
        //                     {name.substring(0, 2).toUpperCase()}
        //                 </AvatarFallback>
        //             </Avatar>
        //         )
        //     },
        // },
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
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id)
                const status = rowValue ? "true" : "false"
                return value.includes(status)
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
            cell: ({ row }) => <TeamActions team={row.original} />
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

                <DataTableFacetedFilter
                    column={table.getColumn("banned")}
                    title="Estado"
                    options={[
                        { label: "Activo", value: "false" },
                        { label: "Baneado", value: "true" },
                    ]}
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

            <DataTablePagination table={table} />
        </div>
    )
}
