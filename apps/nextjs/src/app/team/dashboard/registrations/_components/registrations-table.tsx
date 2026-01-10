
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
import { ChevronDown, MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Badge } from "@acme/ui/badge"
import { useTRPC } from "~/trpc/react"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { DataTableFacetedFilter } from "~/app/_components/table/faceted-filter"
import { RouterOutputs } from "@acme/api"
import { TOURNAMENT_STATUS, TOURNAMENT_DIVISION, WEIGHT_CLASSES, MODALITIES, ATHLETE_GENDER, REGISTRATION_STATUS, ATHLETE_DIVISION } from "@acme/shared/constants"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import { toast } from "@acme/ui/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/ui/dialog"
import { Loader2, FileText } from "lucide-react"
import { getLabelFromValue, getAthleteDivision, mapTournamentDivisionToAthleteDivision } from "@acme/shared"

// Helper type for Registration with relations
type Registration = RouterOutputs["registrations"]["byTeam"][number]

function RegistrationActions({ registration, onUploadClick }: { registration: Registration; onUploadClick: (registration: Registration) => void }) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const deleteRegistration = useMutation(
        trpc.registrations.delete.mutationOptions({
            onSuccess: async () => {
                toast.success("Inscripción eliminada correctamente")
                // Invalidate query
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const isTournamentCompleted = registration.tournament.status === "finished"
    const hasReceipt = !!registration.paymentReceiptUrl

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
                    {!isTournamentCompleted && !hasReceipt && (
                        <DropdownMenuItem onClick={() => onUploadClick(registration)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Subir comprobante
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={() => {
                            if (confirm("¿Estás seguro de eliminar esta inscripción?")) {
                                deleteRegistration.mutate({ id: registration.id })
                            }
                        }}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}

export function RegistrationsDataTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [uploadingRegistration, setUploadingRegistration] = useState<Registration | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data: registrations = [], isLoading } = useSuspenseQuery(trpc.registrations.byTeam.queryOptions());

    // Upload receipt mutation
    const updateReceipt = useMutation(
        trpc.registrations.updatePaymentReceipt.mutationOptions({
            onSuccess: async () => {
                toast.success("Comprobante subido correctamente")
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
                setUploadingRegistration(null)
                setIsUploading(false)
            },
            onError: (err) => {
                toast.error(err.message)
                setIsUploading(false)
            },
        })
    )

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        if (!uploadingRegistration) return
        setIsUploading(true)

        try {
            let fileToUpload: Blob = file
            let fileName = file.name
            const isImage = file.type.startsWith('image/')

            // Optimize images to webp using API
            if (isImage) {
                const optimizeFormData = new FormData()
                optimizeFormData.append('file', file)

                const optimizeResponse = await fetch('/api/optimize-image', {
                    method: 'POST',
                    body: optimizeFormData
                })

                if (optimizeResponse.ok) {
                    fileToUpload = await optimizeResponse.blob()
                    fileName = file.name.replace(/\.[^/.]+$/, '.webp')
                }
            }

            // Upload via secure API route
            const uploadFormData = new FormData()
            uploadFormData.append('file', fileToUpload, fileName)
            uploadFormData.append('eventId', uploadingRegistration.tournament.eventId)
            uploadFormData.append('athleteId', uploadingRegistration.athleteId)

            const response = await fetch('/api/storage/receipt', {
                method: 'POST',
                body: uploadFormData
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error("Error subiendo archivo: " + (error.error || 'Unknown error'))
                setIsUploading(false)
                return
            }

            const { path } = await response.json()

            // Update in database
            updateReceipt.mutate({
                eventId: uploadingRegistration.tournament.eventId,
                athleteId: uploadingRegistration.athleteId,
                receiptUrl: path
            })
        } catch (err) {
            toast.error("Error subiendo archivo")
            setIsUploading(false)
        }
    }

    const columns: ColumnDef<Registration>[] = [
        {
            accessorKey: 'athlete.fullName', // Access nested data
            id: 'athleteName', // Explicit ID for column
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
            accessorKey: 'tournament.event.name',
            id: 'tournamentName', // Explicit ID for faceted filtering
            header: 'Torneo',
            filterFn: (row, id, value) => {
                return value.includes(row.original.tournament.event.name)
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
        // {
        //     id: 'athleteDivision',
        //     header: 'División Atleta',
        //     cell: ({ row }) => {
        //         const athleteDivision = getAthleteDivision(row.original.athlete.birthYear) as "subjunior" | "junior" | "open" | "master_1" | "master_2" | "master_3" | "master_4"
        //         const athleteDivisionLabel = getLabelFromValue(athleteDivision, ATHLETE_DIVISION)
        //         return athleteDivisionLabel
        //     },
        // },
        {
            accessorKey: 'tournament.division',
            id: 'tournamentDivision',
            header: 'División Torneo',
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
            accessorKey: 'modality',
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
            accessorKey: 'status',
            header: 'Estado Insc.',
            cell: ({ row }) => {
                const status = row.original.status;
                return <Badge variant={status === "pending" ? "accent" : status === "approved" ? "default" : "secondary"}>{getLabelFromValue(status, REGISTRATION_STATUS)}</Badge>
            },
            filterFn: (row, id, value) => {
                return value.includes(row.original.status)
            },
        },
        {
            accessorKey: 'paymentReceiptUrl',
            header: 'Comprobante',
            cell: function ReceiptCell({ row }) {
                const path = row.original.paymentReceiptUrl
                const isTournamentCompleted = row.original.tournament.status === "finished"
                const [isLoading, setIsLoading] = useState(false)

                // No receipt and tournament completed
                if (!path && isTournamentCompleted) {
                    return <span className="text-muted-foreground text-xs italic">No disponible</span>
                }

                // No receipt yet
                if (!path) {
                    return <span className="text-muted-foreground text-xs">-</span>
                }

                return (
                    <button
                        disabled={isLoading}
                        onClick={async () => {
                            setIsLoading(true)
                            try {
                                const response = await fetch(`/api/storage/receipt?path=${encodeURIComponent(path)}`)
                                if (response.ok) {
                                    const { url } = await response.json()
                                    window.open(url, '_blank')
                                } else {
                                    toast.error("Error obteniendo comprobante")
                                }
                            } catch {
                                toast.error("Error obteniendo comprobante")
                            } finally {
                                setIsLoading(false)
                            }
                        }}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                        {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <FileText className="h-3 w-3" />
                        )}
                        Ver
                    </button>
                )
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => <RegistrationActions registration={row.original} onUploadClick={setUploadingRegistration} />
        }
    ]

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
    })

    // Extract unique tournaments for filter options
    const uniqueTournaments = Array.from(new Set(registrations.map(r => r.tournament.event.name)))
        .map(name => ({ label: name, value: name }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return (
        <div className="space-y-4">
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
                    {/* Tournament Filter */}
                    {uniqueTournaments.length > 0 && <DataTableFacetedFilter
                        column={table.getColumn("tournamentName")}
                        title="Torneos"
                        options={uniqueTournaments}
                    />}

                    {/* Gender Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("athleteGender")}
                        title="Género"
                        options={ATHLETE_GENDER}
                    />

                    {/* Status Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("tournamentStatus")}
                        title="Estado Torneo"
                        options={TOURNAMENT_STATUS}
                    />

                    {/* Tournament Division Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("tournamentDivision")}
                        title="División Torneo"
                        options={TOURNAMENT_DIVISION}
                    />

                    {/* Weight Class Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("weightClass")}
                        title="Categoría"
                        options={WEIGHT_CLASSES}
                    />

                    {/* Modality Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("modality")}
                        title="Modalidad"
                        options={MODALITIES}
                    />

                    {/* Registration Status Filter */}
                    <DataTableFacetedFilter
                        column={table.getColumn("status")}
                        title="Estado Inscripción"
                        options={REGISTRATION_STATUS}
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

            {/* Upload Dialog with Drag & Drop */}
            <Dialog open={!!uploadingRegistration} onOpenChange={(open) => !open && setUploadingRegistration(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Subir Comprobante de Pago</DialogTitle>
                    </DialogHeader>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                            }`}
                        onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsDragging(true)
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsDragging(false)
                        }}
                        onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsDragging(false)
                            const file = e.dataTransfer.files[0]
                            if (file) {
                                handleFileUpload(file)
                            }
                        }}
                        onClick={() => {
                            const input = document.getElementById('upload-dialog-file-input-reg') as HTMLInputElement
                            input?.click()
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id="upload-dialog-file-input-reg"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    handleFileUpload(file)
                                }
                                e.target.value = ''
                            }}
                        />
                        {isUploading ? (
                            <>
                                <Loader2 className="h-10 w-10 mx-auto text-primary mb-3 animate-spin" />
                                <p className="text-sm text-muted-foreground">Subiendo...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground mb-1">
                                    {isDragging ? (
                                        <span className="text-primary font-medium">Suelta el archivo aquí</span>
                                    ) : (
                                        <>Arrastra un archivo o <span className="text-primary underline">haz clic para seleccionar</span></>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                    Imágenes (JPG, PNG, WEBP) o PDF
                                </p>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
