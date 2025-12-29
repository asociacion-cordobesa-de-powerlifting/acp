"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { useTRPC } from "~/trpc/react"
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@acme/ui/toast"
import { WEIGHT_CLASSES_BY_GENDER, WEIGHT_CLASSES } from "@acme/shared/constants"
import { RouterOutputs } from "@acme/api"
import { WeightClassEnum } from "@acme/db/schema"

type Athlete = RouterOutputs["athletes"]["list"][number]

interface BulkRegData {
    athleteId: string
    fullName: string
    gender: "M" | "F"
    weightClass: WeightClassEnum | ""
    squatOpenerKg: number | null
    benchOpenerKg: number | null
    deadliftOpenerKg: number | null
    isSelected: boolean
}

export function BulkRegistrationForm() {
    const trpc = useTRPC()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>("")

    // 1. Fetch Athletes and Tournaments
    const { data: athletes = [] } = useSuspenseQuery(trpc.athletes.list.queryOptions())
    const { data: allTournaments = [] } = useSuspenseQuery(trpc.tournaments.list.queryOptions())

    // Filter tournaments that are instances (have parentId)
    const instances = allTournaments.filter((t: any) => t.parentId !== null)

    // 2. Local State for Form Data
    const [formData, setFormData] = useState<BulkRegData[]>(
        athletes.map(a => ({
            athleteId: a.id,
            fullName: a.fullName,
            gender: a.gender as "M" | "F",
            weightClass: "",
            squatOpenerKg: null,
            benchOpenerKg: null,
            deadliftOpenerKg: null,
            isSelected: false
        }))
    )

    const updateRow = (id: string, updates: Partial<BulkRegData>) => {
        setFormData(prev => prev.map(row => row.athleteId === id ? { ...row, ...updates } : row))
    }

    // 3. Mutation
    const bulkRegister = useMutation(
        (trpc.registrations as any).bulkRegister.mutationOptions({
            onSuccess: () => {
                toast.success("Inscripciones procesadas exitosamente")
                router.push("/team/dashboard/registrations")
            },
            onError: (err: any) => {
                toast.error(err.message)
            }
        })
    )

    // 4. Table Columns
    const columns: ColumnDef<BulkRegData>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={(e) => {
                        const checked = e.target.checked
                        setFormData(prev => prev.map(r => ({ ...r, isSelected: checked })))
                    }}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={row.original.isSelected}
                    onChange={(e) => updateRow(row.original.athleteId, { isSelected: e.target.checked })}
                />
            )
        },
        {
            accessorKey: 'fullName',
            header: 'Atleta',
        },
        {
            id: 'weightClass',
            header: 'Categoría',
            cell: ({ row }) => {
                const athlete = row.original;
                const availableClasses = WEIGHT_CLASSES.filter(c => c.value.startsWith(athlete.gender));
                return (
                    <Select
                        value={athlete.weightClass}
                        onValueChange={(val) => updateRow(athlete.athleteId, { weightClass: val as WeightClassEnum })}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Cat." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableClasses.map(c => (
                                <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            }
        },
        {
            id: 'openers',
            header: 'Openers (SQ / BP / DL)',
            cell: ({ row }) => {
                const athlete = row.original;
                return (
                    <div className="flex gap-1">
                        <Input
                            type="number"
                            placeholder="SQ"
                            className="w-16 h-8 text-xs"
                            value={athlete.squatOpenerKg ?? ""}
                            onChange={(e) => updateRow(athlete.athleteId, { squatOpenerKg: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                        <Input
                            type="number"
                            placeholder="BP"
                            className="w-16 h-8 text-xs"
                            value={athlete.benchOpenerKg ?? ""}
                            onChange={(e) => updateRow(athlete.athleteId, { benchOpenerKg: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                        <Input
                            type="number"
                            placeholder="DL"
                            className="w-16 h-8 text-xs"
                            value={athlete.deadliftOpenerKg ?? ""}
                            onChange={(e) => updateRow(athlete.athleteId, { deadliftOpenerKg: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                    </div>
                )
            }
        }
    ]

    const table = useReactTable({
        data: formData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const handleSubmit = () => {
        if (!selectedTournamentId) {
            toast.error("Seleccione un torneo")
            return
        }

        const selectedRegs = formData.filter(r => r.isSelected);
        if (selectedRegs.length === 0) {
            toast.error("Seleccione al menos un atleta")
            return
        }

        // Validate weight classes
        if (selectedRegs.some(r => !r.weightClass)) {
            toast.error("Asigne una categoría a todos los atletas seleccionados")
            return
        }

        (bulkRegister.mutate as any)({
            tournamentId: selectedTournamentId,
            registrations: selectedRegs.map(r => ({
                athleteId: r.athleteId,
                weightClass: r.weightClass as WeightClassEnum,
                squatOpenerKg: r.squatOpenerKg,
                benchOpenerKg: r.benchOpenerKg,
                deadliftOpenerKg: r.deadliftOpenerKg,
            }))
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4">
                <div className="flex-1 max-w-sm space-y-2">
                    <label className="text-sm font-medium">Torneo (Instancia)</label>
                    <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un torneo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {instances.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {
                JSON.stringify(allTournaments)
            }

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={bulkRegister.isPending}>
                    {bulkRegister.isPending ? "Inscribiendo..." : "Inscribir Seleccionados"}
                </Button>
            </div>
        </div>
    )
}
