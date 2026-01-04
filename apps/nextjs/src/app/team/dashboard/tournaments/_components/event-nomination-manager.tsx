"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, Users, Save, Search, Filter, ArrowUpDown, Info } from "lucide-react"
import { Button } from "@acme/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { useTRPC } from "~/trpc/react"
import { toast } from "@acme/ui/toast"
import { getEligibleWeightClasses, getOpenCounterpart, canAthleteEnterOpen, matchTournament, getEligibleTournaments, type PlainAthlete, type PlainTournament } from "@acme/shared"
import { WEIGHT_CLASSES, TOURNAMENT_DIVISION, MODALITIES, EQUIPMENT } from "@acme/shared/constants"
import { Badge } from "@acme/ui/badge"
import { ScrollArea } from "@acme/ui/scroll-area"
import { Switch } from "@acme/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card"
import { RouterOutputs } from "@acme/api"
import { cn } from "@acme/ui"
import { dayjs } from "@acme/shared/libs"
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table"
import { Input } from "@acme/ui/input"

type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]

interface EventNominationManagerProps {
    event: EventWithTournaments
    onSuccess?: () => void
    onClose?: () => void
    className?: string
}

type NominationEntry = {
    athleteId: string
    tournamentId: string
    modality: "full" | "bench"
    equipment: "classic" | "equipped"
    weightClass: string
    alsoRegisterOpen: boolean
    isApproved: boolean
    isExisting: boolean
}

export function EventNominationManager({
    event,
    onSuccess,
    onClose,
    className
}: EventNominationManagerProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    // Use standard query options
    const { data: athletes = [] } = useQuery(trpc.athletes.list.queryOptions())
    const { data: registrations = [] } = useQuery(trpc.registrations.byTeam.queryOptions())

    const [localNominations, setLocalNominations] = useState<Record<string, NominationEntry>>({})
    const [globalFilter, setGlobalFilter] = useState("")
    const [sorting, setSorting] = useState<SortingState>([{ id: "fullName", desc: false }])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    // Track last event ID to reset state when event changes
    const lastEventIdRef = useRef<string>(event.id)

    // Initialize local state from registrations
    useEffect(() => {
        // Reset state if event changed
        if (lastEventIdRef.current !== event.id) {
            setLocalNominations({})
            lastEventIdRef.current = event.id
        }

        // Skip if no data yet
        if (athletes.length === 0 || registrations.length === 0) {
            return
        }
        
        const tournamentIdsSet = new Set(event.tournaments.map(t => t.id))
        const initial: Record<string, NominationEntry> = {}

        athletes.forEach(a => {
            const existing = registrations.filter(r =>
                r.athleteId === a.id &&
                tournamentIdsSet.has(r.tournamentId) &&
                !r.deletedAt
            )

            if (existing.length > 0) {
                const nonOpenReg = existing.find(r => r.tournament.division !== 'open')
                const openReg = existing.find(r => r.tournament.division === 'open')
                const mainReg = nonOpenReg || openReg!

                initial[a.id] = {
                    athleteId: a.id,
                    tournamentId: mainReg.tournamentId,
                    modality: mainReg.tournament.modality as any,
                    equipment: mainReg.tournament.equipment as any,
                    weightClass: mainReg.weightClass ?? "",
                    alsoRegisterOpen: !!nonOpenReg && !!openReg,
                    isApproved: existing.some(r => r.status === 'approved'),
                    isExisting: true
                }
            }
        })

        setLocalNominations(prev => {
            // Only update if the content actually changed
            const prevKeys = Object.keys(prev).sort()
            const newKeys = Object.keys(initial).sort()
            if (prevKeys.length !== newKeys.length) {
                return initial
            }
            if (prevKeys.length === 0 && newKeys.length === 0) {
                return prev
            }
            const hasChanges = prevKeys.some(key => {
                const prevEntry = prev[key]
                const newEntry = initial[key]
                if (!prevEntry || !newEntry) return true
                return (
                    prevEntry.tournamentId !== newEntry.tournamentId ||
                    prevEntry.modality !== newEntry.modality ||
                    prevEntry.equipment !== newEntry.equipment ||
                    prevEntry.weightClass !== newEntry.weightClass ||
                    prevEntry.alsoRegisterOpen !== newEntry.alsoRegisterOpen ||
                    prevEntry.isApproved !== newEntry.isApproved ||
                    prevEntry.isExisting !== newEntry.isExisting
                )
            }) || newKeys.some(key => !prev[key])
            return hasChanges ? initial : prev
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id, athletes, registrations])

    const syncRegistrations = useMutation(
        trpc.registrations.syncEventRegistrations.mutationOptions({
            onSuccess: async () => {
                toast.success("Nómina sincronizada exitosamente")
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
                onSuccess?.()
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    // Helper function to find the best available tournament for an athlete
    // Prioritizes: "full" > "bench", "classic" > "equipped"
    const findBestTournament = (plainAthlete: PlainAthlete, plainTournaments: PlainTournament[]): PlainTournament | undefined => {
        const eligible = getEligibleTournaments(plainAthlete, plainTournaments)
        if (eligible.length === 0) return undefined

        // Priority order: full+classic > full+equipped > bench+classic > bench+equipped
        const priorityOrder = [
            { modality: "full" as const, equipment: "classic" as const },
            { modality: "full" as const, equipment: "equipped" as const },
            { modality: "bench" as const, equipment: "classic" as const },
            { modality: "bench" as const, equipment: "equipped" as const },
        ]

        for (const priority of priorityOrder) {
            const match = matchTournament(plainAthlete, priority.modality, priority.equipment, eligible)
            if (match) return match
        }

        // Fallback: return first eligible tournament
        return eligible[0]
    }

    const toggleAthlete = (athleteId: string) => {
        setLocalNominations(prev => {
            const newNom = { ...prev }
            const existing = newNom[athleteId]
            if (existing) {
                if (existing.isApproved) return prev
                delete newNom[athleteId]
            } else {
                const a = athletes.find(at => at.id === athleteId)
                if (!a) return prev

                const plainAthlete = { gender: a.gender as "M" | "F", birthYear: a.birthYear }
                const plainTournaments = event.tournaments.map(t => ({
                    id: t.id,
                    division: t.division as any,
                    modality: t.modality as any,
                    equipment: t.equipment as any
                }))

                const matched = findBestTournament(plainAthlete, plainTournaments)
                if (!matched) return prev

                const eligibleWeights = getEligibleWeightClasses(plainAthlete, matched)

                newNom[athleteId] = {
                    athleteId,
                    tournamentId: matched.id,
                    modality: matched.modality,
                    equipment: matched.equipment,
                    weightClass: eligibleWeights[0] ?? "",
                    alsoRegisterOpen: false,
                    isApproved: false,
                    isExisting: false
                }
            }
            return newNom
        })
    }

    // Helper to get available modalities for an athlete based on event tournaments
    const getAvailableModalities = (plainAthlete: PlainAthlete, plainTournaments: PlainTournament[]): ("full" | "bench")[] => {
        const eligible = getEligibleTournaments(plainAthlete, plainTournaments)
        const modalities = new Set<"full" | "bench">()
        eligible.forEach(t => modalities.add(t.modality))
        return Array.from(modalities)
    }

    // Helper to get available equipment for an athlete based on event tournaments and selected modality
    const getAvailableEquipment = (plainAthlete: PlainAthlete, plainTournaments: PlainTournament[], modality: "full" | "bench"): ("classic" | "equipped")[] => {
        const eligible = getEligibleTournaments(plainAthlete, plainTournaments)
        const equipment = new Set<"classic" | "equipped">()
        eligible.filter(t => t.modality === modality).forEach(t => equipment.add(t.equipment))
        return Array.from(equipment)
    }

    const updateNomination = (athleteId: string, updates: Partial<NominationEntry>) => {
        setLocalNominations(prev => {
            const current = prev[athleteId]
            if (!current || current.isApproved) return prev

            const newNom = { ...current, ...updates }

            if (updates.modality || updates.equipment) {
                const a = athletes.find(at => at.id === athleteId)
                if (a) {
                    const plainAthlete = { gender: a.gender as "M" | "F", birthYear: a.birthYear }
                    const plainTournaments = event.tournaments.map(t => ({
                        id: t.id,
                        division: t.division as any,
                        modality: t.modality as any,
                        equipment: t.equipment as any
                    }))
                    
                    // If only modality changed, check if current equipment is compatible
                    if (updates.modality && !updates.equipment) {
                        const availableEquipment = getAvailableEquipment(plainAthlete, plainTournaments, newNom.modality)
                        // If current equipment is not available for new modality, use first available
                        if (!availableEquipment.includes(newNom.equipment) && availableEquipment.length > 0 && availableEquipment[0]) {
                            newNom.equipment = availableEquipment[0]
                        }
                    }
                    
                    // Validate that the combination exists
                    const matched = matchTournament(plainAthlete, newNom.modality, newNom.equipment, plainTournaments)
                    if (matched) {
                        newNom.tournamentId = matched.id
                        // Update weight class if needed
                        const eligibleWeights = getEligibleWeightClasses(plainAthlete, matched)
                        if (!eligibleWeights.includes(newNom.weightClass) && eligibleWeights.length > 0 && eligibleWeights[0]) {
                            newNom.weightClass = eligibleWeights[0]
                        }
                    } else {
                        // If combination doesn't exist, find best alternative for the selected modality
                        const eligible = getEligibleTournaments(plainAthlete, plainTournaments)
                        const filtered = eligible.filter(t => t.modality === newNom.modality)
                        if (filtered.length > 0) {
                            // Prefer current equipment if available, otherwise use first available
                            const preferred = filtered.find(t => t.equipment === newNom.equipment) || filtered[0]
                            if (preferred) {
                                newNom.equipment = preferred.equipment
                                newNom.tournamentId = preferred.id
                                const eligibleWeights = getEligibleWeightClasses(plainAthlete, preferred)
                                newNom.weightClass = eligibleWeights[0] ?? ""
                            } else {
                                // No tournament available for this modality, don't update
                                return prev
                            }
                        } else {
                            // No tournament available for this modality, don't update
                            return prev
                        }
                    }
                }
            }

            return {
                ...prev,
                [athleteId]: newNom
            }
        })
    }

    const handleSubmit = () => {
        const nominationList = Object.values(localNominations).map(n => ({
            athleteId: n.athleteId,
            tournamentId: n.tournamentId,
            weightClass: n.weightClass as any,
            alsoRegisterOpen: n.alsoRegisterOpen
        }))

        syncRegistrations.mutate({
            eventId: event.id,
            nominations: nominationList
        })
    }

    const summary = useMemo(() => {
        const currentIds = new Set(Object.values(localNominations).map(n => n.athleteId))
        const existingIds = new Set(registrations.filter(r =>
            event.tournaments.some(t => t.id === r.tournamentId) && !r.deletedAt
        ).map(r => r.athleteId))

        const news = Object.values(localNominations).filter(n => !n.isExisting).length
        const remaining = Object.values(localNominations).filter(n => n.isExisting).length
        const removed = Array.from(existingIds).filter(id => !currentIds.has(id)).length

        return { news, removed, remaining }
    }, [localNominations, registrations, event.tournaments])

    const tableData = useMemo(() => {
        return athletes.map(a => {
            const entry = localNominations[a.id]
            const plainAthlete = { gender: a.gender as "M" | "F", birthYear: a.birthYear }
            const plainTournaments = event.tournaments.map(t => ({
                id: t.id,
                division: t.division as any,
                modality: t.modality as any,
                equipment: t.equipment as any
            }))

            let matched: PlainTournament | undefined
            if (entry) {
                // If there's an entry, match with the entry's modality and equipment
                matched = matchTournament(plainAthlete, entry.modality, entry.equipment, plainTournaments)
            } else {
                // If there's no entry, check if there are any eligible tournaments available
                // This allows the checkbox to be enabled if the athlete can participate
                const eligibleTournaments = getEligibleTournaments(plainAthlete, plainTournaments)
                if (eligibleTournaments.length > 0) {
                    // Use findBestTournament to get the best match (but don't set it as matched yet)
                    // We just want to know if there's at least one tournament available
                    matched = findBestTournament(plainAthlete, plainTournaments)
                }
            }

            return {
                ...a,
                entry,
                matched,
                plainAthlete,
                plainTournaments
            }
        })
    }, [athletes, localNominations, event.tournaments])

    const columnHelper = createColumnHelper<typeof tableData[number]>()

    const columns = useMemo(() => [
        columnHelper.accessor("id", {
            id: "select",
            header: "",
            cell: ({ row }) => {
                const a = row.original
                return (
                    <div className="flex justify-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={!!a.entry}
                            onChange={() => toggleAthlete(a.id)}
                            disabled={a.entry?.isApproved || (!a.matched && !a.entry)}
                        />
                    </div>
                )
            },
        }),
        columnHelper.accessor("fullName", {
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent -ml-3"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Atleta
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const a = row.original
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold">{a.fullName}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-md text-muted-foreground uppercase">
                                {a.gender} • {dayjs().year() - a.birthYear} años
                            </span>
                            {a.matched && (
                                <Badge variant="secondary" className="h-3.5 px-1 text-[8px] uppercase">
                                    {TOURNAMENT_DIVISION.find(d => d.value === a.matched?.division)?.label}
                                </Badge>
                            )}
                            {a.entry?.isApproved && (
                                <Badge variant="accent" className="h-3.5 px-1 text-[8px]">Aprobado</Badge>
                            )}
                            {!a.matched && !a.entry && (
                                <span className="text-destructive font-bold text-[8px]">SIN TORNEO</span>
                            )}
                        </div>
                    </div>
                )
            },
            filterFn: "includesString"
        }),
        columnHelper.accessor(row => row.entry?.modality || "full", {
            id: "modality",
            header: "Modalidad",
            cell: ({ row }) => {
                const a = row.original
                if (!a.entry) return null
                
                const availableModalities = getAvailableModalities(a.plainAthlete, a.plainTournaments)
                const currentModality = a.entry.modality
                
                // If current modality is not available, don't show the select (shouldn't happen but safety check)
                if (!availableModalities.includes(currentModality)) return null
                
                return (
                    <Select
                        disabled={a.entry.isApproved}
                        value={currentModality}
                        onValueChange={(val) => updateNomination(a.id, { modality: val as any })}
                    >
                        <SelectTrigger className="h-8 py-0 text-xs font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MODALITIES.filter(m => availableModalities.includes(m.value as "full" | "bench")).map(m => (
                                <SelectItem key={m.value} value={m.value} className="text-xs">
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            },
        }),
        columnHelper.accessor(row => row.entry?.equipment || "classic", {
            id: "equipment",
            header: "Equipo",
            cell: ({ row }) => {
                const a = row.original
                if (!a.entry) return null
                
                const currentModality = a.entry.modality
                const availableEquipment = getAvailableEquipment(a.plainAthlete, a.plainTournaments, currentModality)
                const currentEquipment = a.entry.equipment
                
                // If current equipment is not available, don't show the select (shouldn't happen but safety check)
                if (!availableEquipment.includes(currentEquipment)) return null
                
                return (
                    <Select
                        disabled={a.entry.isApproved}
                        value={currentEquipment}
                        onValueChange={(val) => updateNomination(a.id, { equipment: val as any })}
                    >
                        <SelectTrigger className="h-8 py-0 text-xs font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EQUIPMENT.filter(e => availableEquipment.includes(e.value as "classic" | "equipped")).map(e => (
                                <SelectItem key={e.value} value={e.value} className="text-xs">
                                    {e.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            },
        }),
        columnHelper.accessor("entry.weightClass", {
            id: "weightClass",
            header: "Categoría",
            cell: ({ row }) => {
                const a = row.original
                const eligibleWeights = a.matched ? getEligibleWeightClasses(a.plainAthlete, a.matched) : []
                return (
                    <Select
                        disabled={!a.entry || a.entry.isApproved || !a.matched}
                        value={a.entry?.weightClass || ""}
                        onValueChange={(val) => updateNomination(a.id, { weightClass: val })}
                    >
                        <SelectTrigger className="h-8 py-0 text-xs text-left">
                            <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {eligibleWeights.map(w => (
                                <SelectItem key={w} value={w} className="text-xs">
                                    {WEIGHT_CLASSES.find(wc => wc.value === w)?.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            },
        }),
        columnHelper.accessor("entry.alsoRegisterOpen", {
            id: "open",
            header: "Doble Insc.",
            cell: ({ row }) => {
                const a = row.original
                const openCounterpart = a.matched ? getOpenCounterpart(a.matched, a.plainTournaments) : undefined
                const canEnterOpenAttr = canAthleteEnterOpen(a.plainAthlete)
                if (!openCounterpart || !canEnterOpenAttr) return <span className="text-[9px] text-muted-foreground flex justify-center">-</span>

                return (
                    <div className="flex flex-col items-center gap-1 justify-center">
                        <Switch
                            checked={a.entry?.alsoRegisterOpen || false}
                            onCheckedChange={(checked) => updateNomination(a.id, { alsoRegisterOpen: checked })}
                            disabled={!a.entry || a.entry.isApproved}
                            //@ts-ignore
                            size="sm"
                        />
                        <span className="text-[8px] text-muted-foreground font-bold uppercase">Open</span>
                    </div>
                )
            }
        }),
        columnHelper.accessor("gender", { id: "gender", header: () => null, cell: () => null }),
        columnHelper.accessor(row => row.matched?.division, { id: "division", header: () => null, cell: () => null }),
    ], [localNominations, event.tournaments, athletes])

    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            globalFilter,
            sorting,
            columnFilters,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                        Nuevas: <span className="ml-1 text-primary font-bold">{summary.news}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Eliminadas: <span className="ml-1 text-destructive font-bold">{summary.removed}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Permanecen: <span className="ml-1 text-muted-foreground font-bold">{summary.remaining}</span>
                    </Badge>
                </div>
            </div>

            {/* Tournaments Info Card */}
            <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm font-semibold text-foreground">Disponible:</span>
                        </div>
                        
                        {(() => {
                            const uniqueModalities = [...new Set(event.tournaments.map(t => t.modality))]
                            const uniqueEquipment = [...new Set(event.tournaments.map(t => t.equipment))]
                            const uniqueDivisions = [...new Set(event.tournaments.map(t => t.division))]
                            
                            return (
                                <div className="flex items-center gap-3 flex-wrap">
                                    {uniqueModalities.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground">Modalidades:</span>
                                            <div className="flex items-center gap-1">
                                                {uniqueModalities.map(modality => {
                                                    const label = MODALITIES.find(m => m.value === modality)?.label ?? modality
                                                    return (
                                                        <Badge key={modality} variant="secondary" className="text-xs py-0.5 px-2">
                                                            {label}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {uniqueEquipment.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground">Equipo:</span>
                                            <div className="flex items-center gap-1">
                                                {uniqueEquipment.map(equipment => {
                                                    const label = EQUIPMENT.find(e => e.value === equipment)?.label ?? equipment
                                                    return (
                                                        <Badge key={equipment} variant="secondary" className="text-xs py-0.5 px-2">
                                                            {label}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {uniqueDivisions.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground">Divisiones:</span>
                                            <div className="flex items-center gap-1">
                                                {uniqueDivisions.map(division => {
                                                    const label = TOURNAMENT_DIVISION.find(d => d.value === division)?.label ?? division
                                                    return (
                                                        <Badge key={division} variant="secondary" className="text-xs py-0.5 px-2">
                                                            {label}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {event.tournaments.length === 0 && (
                                        <span className="text-xs text-muted-foreground italic">No hay torneos disponibles</span>
                                    )}
                                </div>
                            )
                        })()}
                    </div>
                </CardContent>
            </Card>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-lg border border-muted-foreground/10">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar atleta por nombre..."
                        className="pl-9 h-9"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                        value={(table.getColumn("gender")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("gender")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-[120px] text-xs">
                            <SelectValue placeholder="Género" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Género: Todos</SelectItem>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={(table.getColumn("division")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("division")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-[130px] text-xs">
                            <SelectValue placeholder="División" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">División: Todas</SelectItem>
                            {TOURNAMENT_DIVISION.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={(table.getColumn("modality")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("modality")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-[140px] text-xs">
                            <SelectValue placeholder="Modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Modalidad: Todas</SelectItem>
                            {MODALITIES.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={(table.getColumn("equipment")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("equipment")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-[130px] text-xs">
                            <SelectValue placeholder="Equipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Equipo: Todos</SelectItem>
                            {EQUIPMENT.map(e => (
                                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-hidden border rounded-md mt-3 mb-4">
                <ScrollArea className="h-full">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10 shadow-sm">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="border-b">
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="p-3 text-left font-medium">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y bg-card">
                            {table.getRowModel().rows.map(row => (
                                <tr key={row.id} className={cn(
                                    "transition-colors hover:bg-muted/30",
                                    row.original.entry?.isApproved && "bg-muted/20"
                                )}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="p-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {table.getRowModel().rows.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">
                                        No se encontraron atletas con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </ScrollArea>
            </div>

            <div className="flex items-center justify-between w-full border-t pt-4 mt-auto">
                <div className="text-muted-foreground text-xs">
                    * Los atletas con estados <span className="text-accent font-bold underline">aprobado</span> no pueden ser modificados.
                </div>
                <div className="flex gap-3">
                    {onClose && (
                        <Button variant="ghost" onClick={onClose}>
                            Cerrar
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={syncRegistrations.isPending}
                        className="shadow-md"
                    >
                        {syncRegistrations.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Sincronizar Nómina
                    </Button>
                </div>
            </div>
        </div>
    )
}
