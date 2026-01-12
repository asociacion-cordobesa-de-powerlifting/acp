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

// Define Team type (based on teamData with user)
type TeamWithUser = {
    id: string;
    slug: string;
    userId: string;
    isAffiliated: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        image?: string | null;
        role?: string | null;
        banned?: boolean | null;
    };
}

function TeamActions({ team }: { team: TeamWithUser }) {
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [banReason, setBanReason] = useState("")
    const [banDuration, setBanDuration] = useState<string>("")
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const handleBanUser = async () => {
        // Build ban options
        const banOptions: { userId: string; banReason?: string; banExpiresIn?: number } = {
            userId: team.user.id,
        };

        if (banReason.trim()) {
            banOptions.banReason = banReason.trim();
        }

        if (banDuration) {
            // Convert duration to seconds
            const durationInSeconds = parseInt(banDuration) * 60 * 60; // hours to seconds
            banOptions.banExpiresIn = durationInSeconds;
        }

        const { error } = await authClient.admin.banUser(banOptions);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Equipo baneado correctamente");
            void queryClient.invalidateQueries(trpc.teams.listWithTeamData.pathFilter());
            // Reset form
            setBanReason("");
            setBanDuration("");
        }
    };

    const handleUnbanUser = async () => {
        const { error } = await authClient.admin.unbanUser({ userId: team.user.id });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Equipo desbaneado correctamente");
            void queryClient.invalidateQueries(trpc.teams.listWithTeamData.pathFilter());
        }
    };

    const handleDeleteUser = async () => {
        const { error } = await authClient.admin.removeUser({ userId: team.user.id });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Equipo eliminado correctamente");
            void queryClient.invalidateQueries(trpc.teams.listWithTeamData.pathFilter());
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
                        {team.user.banned ? 'Desbanear' : 'Banear (Bloquear acceso)'}
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
                team={{
                    id: team.user.id,
                    name: team.user.name,
                    email: team.user.email,
                    teamDataId: team.id,
                    isAffiliated: team.isAffiliated,
                }}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />

            {/* Ban/Unban Dialog */}
            <AlertDialog open={isBanDialogOpen} onOpenChange={(open) => {
                setIsBanDialogOpen(open);
                if (!open) {
                    setBanReason("");
                    setBanDuration("");
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿{team.user.banned ? 'Desbanear' : 'Banear'} a este equipo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {team.user.banned
                                ? "El equipo recuperará el acceso a la plataforma."
                                : "El equipo perderá el acceso a la plataforma hasta que sea desbaneado."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Ban options - only show when banning, not unbanning */}
                    {!team.user.banned && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <label htmlFor="ban-reason" className="text-sm font-medium">
                                    Razón del ban (opcional)
                                </label>
                                <Input
                                    id="ban-reason"
                                    placeholder="Ej: Incumplimiento de normas"
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="ban-duration" className="text-sm font-medium">
                                    Duración del ban (opcional)
                                </label>
                                <select
                                    id="ban-duration"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={banDuration}
                                    onChange={(e) => setBanDuration(e.target.value)}
                                >
                                    <option value="">Permanente</option>
                                    <option value="1">1 hora</option>
                                    <option value="24">24 horas</option>
                                    <option value="168">1 semana</option>
                                    <option value="720">30 días</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (team.user.banned) {
                                void handleUnbanUser();
                            } else {
                                void handleBanUser();
                            }
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta del equipo "{team.user.name}" y todos sus datos asociados.
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

    const { data: teams = [], isLoading } = useSuspenseQuery(trpc.teams.listWithTeamData.queryOptions());

    // Define columns
    const columns: ColumnDef<TeamWithUser>[] = [
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
            accessorKey: 'user.name',
            id: 'name',
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
            cell: ({ row }) => row.original.user.name,
        },
        {
            accessorKey: 'user.email',
            id: 'email',
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
            cell: ({ row }) => row.original.user.email,
        },
        {
            accessorKey: 'isAffiliated',
            header: 'Afiliado',
            cell: ({ row }) => {
                return row.original.isAffiliated
                    ? <Badge className="bg-green-600">Sí</Badge>
                    : <Badge variant="outline">No</Badge>
            },
            filterFn: (row, id, value) => {
                const isAffiliated = row.original.isAffiliated
                const status = isAffiliated ? "true" : "false"
                return value.includes(status)
            }
        },
        {
            accessorKey: 'user.banned',
            id: 'banned',
            header: 'Estado',
            cell: ({ row }) => {
                return row.original.user.banned ? <Badge variant="destructive">Baneado</Badge> : <Badge variant="outline">Activo</Badge>
            },
            filterFn: (row, id, value) => {
                const rowValue = row.original.user.banned
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
                    column={table.getColumn("isAffiliated")}
                    title="Afiliación"
                    options={[
                        { label: "Afiliado", value: "true" },
                        { label: "No afiliado", value: "false" },
                    ]}
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
