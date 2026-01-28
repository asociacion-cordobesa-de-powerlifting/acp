"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, Users, Save, Search, Filter, ArrowUpDown, Info, Upload, FileText, X } from "lucide-react"
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
import { getEligibleWeightClasses, getOpenCounterpart, canAthleteEnterOpen, matchTournament, getEligibleTournaments, getAthleteDivision, mapTournamentDivisionToAthleteDivision, getLabelFromValue, type PlainAthlete, type PlainTournament } from "@acme/shared"
import { WEIGHT_CLASSES, TOURNAMENT_DIVISION, MODALITIES, EQUIPMENT, ATHLETE_DIVISION } from "@acme/shared/constants"
import { Badge } from "@acme/ui/badge"
import { ScrollArea } from "@acme/ui/scroll-area"
import { Switch } from "@acme/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/ui/dialog"
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
import { EventCoachSelector } from "./event-coach-selector"

type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]

interface EventNominationManagerProps {
    event: EventWithTournaments
    onSuccess?: () => void
    onClose?: () => void
    className?: string
}

type NominationEntry = {
    athleteId: string
    tournamentId: string // Base tournament ID (division correspondiente)
    modality: "full" | "bench"
    equipment: "classic" | "equipped"
    weightClass: string
    divisionMode: "division_only" | "open_only" | "both"
    modalityMode: "full_only" | "bench_only" | "both_modalities"
    isApproved: boolean
    isRejected: boolean
    isExisting: boolean
    // Status for each division when in "both" mode
    divisionStatus?: "pending" | "approved" | "rejected"
    openStatus?: "pending" | "approved" | "rejected"
    // Payment receipt
    paymentReceiptUrl?: string | null
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
    const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery(trpc.athletes.list.queryOptions())
    const { data: registrations = [], isLoading: isLoadingRegistrations } = useQuery(trpc.registrations.byTeam.queryOptions())
    const { data: teamData } = useQuery(trpc.teams.myData.queryOptions())

    const isLoading = isLoadingAthletes || isLoadingRegistrations

    // Get the appropriate description based on team affiliation
    const eventDescription = teamData?.isAffiliated
        ? event.descriptionAffiliates
        : event.descriptionNonAffiliates

    const [localNominations, setLocalNominations] = useState<Record<string, NominationEntry>>({})
    const [globalFilter, setGlobalFilter] = useState("")
    const [sorting, setSorting] = useState<SortingState>([{ id: "fullName", desc: false }])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [hideRegistered, setHideRegistered] = useState(false)
    const [uploadingAthleteId, setUploadingAthleteId] = useState<string | null>(null)
    const [uploadDialogAthleteId, setUploadDialogAthleteId] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [viewingReceiptAthleteId, setViewingReceiptAthleteId] = useState<string | null>(null)
    const [deleteConfirmAthleteId, setDeleteConfirmAthleteId] = useState<string | null>(null)

    // Payment receipt mutation
    const updateReceipt = useMutation(
        trpc.registrations.updatePaymentReceipt.mutationOptions({
            onSuccess: async () => {
                toast.success("Comprobante actualizado")
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
            onSettled: () => {
                setUploadingAthleteId(null)
            }
        })
    )

    // File upload handler (uses secure API route)
    const handleFileUpload = async (athleteId: string, file?: File) => {
        if (!file) return

        setUploadingAthleteId(athleteId)

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
                } else {
                    console.warn('Image optimization failed, uploading original')
                }
            }

            // Upload via secure API route
            const uploadFormData = new FormData()
            uploadFormData.append('file', fileToUpload, fileName)
            uploadFormData.append('eventId', event.id)
            uploadFormData.append('athleteId', athleteId)

            const response = await fetch('/api/storage/receipt', {
                method: 'POST',
                body: uploadFormData
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error("Error subiendo archivo: " + (error.error || 'Unknown error'))
                setUploadingAthleteId(null)
                return
            }

            const { path } = await response.json()

            // Update in database (store path, not URL)
            updateReceipt.mutate({
                eventId: event.id,
                athleteId,
                receiptUrl: path // Actually storing the path
            })

            // Update local state
            setLocalNominations(prev => {
                const current = prev[athleteId]
                if (!current) return prev
                return {
                    ...prev,
                    [athleteId]: { ...current, paymentReceiptUrl: path }
                }
            })
        } catch (err) {
            toast.error("Error subiendo archivo")
            setUploadingAthleteId(null)
        }
    }

    // Remove receipt handler (uses secure API route)
    const handleRemoveReceipt = async (athleteId: string) => {
        setUploadingAthleteId(athleteId)

        try {
            // Delete from storage via secure API route
            const response = await fetch('/api/storage/receipt', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: event.id, athleteId })
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error("Error eliminando archivo: " + (error.error || 'Unknown error'))
                setUploadingAthleteId(null)
                return
            }

            // Remove from database (set to null)
            updateReceipt.mutate({
                eventId: event.id,
                athleteId,
                receiptUrl: null
            })

            // Update local state
            setLocalNominations(prev => {
                const current = prev[athleteId]
                if (!current) return prev
                return {
                    ...prev,
                    [athleteId]: { ...current, paymentReceiptUrl: null }
                }
            })
        } catch (err) {
            toast.error("Error eliminando archivo")
            setUploadingAthleteId(null)
        }
    }

    // View receipt handler (fetches fresh signed URL and opens in new tab)
    const handleViewReceipt = async (athleteId: string, path: string) => {
        setViewingReceiptAthleteId(athleteId)
        try {
            const response = await fetch(`/api/storage/receipt?path=${encodeURIComponent(path)}`)

            if (!response.ok) {
                toast.error("Error obteniendo comprobante")
                return
            }

            const { url } = await response.json()
            window.open(url, '_blank')
        } catch (err) {
            toast.error("Error obteniendo comprobante")
        } finally {
            setViewingReceiptAthleteId(null)
        }
    }

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

        for (const a of athletes) {
            const existing = registrations.filter(r =>
                r.athleteId === a.id &&
                tournamentIdsSet.has(r.tournamentId) &&
                !r.deletedAt
            )

            if (existing.length > 0) {
                const nonOpenReg = existing.find(r => r.tournament.division !== 'open')
                const openReg = existing.find(r => r.tournament.division === 'open')

                // Determine division mode and base tournament ID
                let divisionMode: "division_only" | "open_only" | "both" = "division_only"
                let baseTournamentId: string
                const mainReg = nonOpenReg || openReg

                if (!mainReg) continue // Skip if no valid registration found

                if (nonOpenReg && openReg) {
                    divisionMode = "both"
                    baseTournamentId = nonOpenReg.tournamentId // Use non-open as base
                } else if (nonOpenReg) {
                    divisionMode = "division_only"
                    baseTournamentId = nonOpenReg.tournamentId
                } else if (openReg) {
                    // Only open registration - need to find the base (non-open) tournament
                    const baseTournament = event.tournaments.find(t =>
                        t.modality === openReg.tournament.modality &&
                        t.equipment === openReg.tournament.equipment &&
                        t.division !== 'open'
                    )
                    if (baseTournament) {
                        divisionMode = "open_only"
                        baseTournamentId = baseTournament.id
                    } else {
                        // Fallback: use open tournament ID (shouldn't happen normally)
                        divisionMode = "division_only"
                        baseTournamentId = openReg.tournamentId
                    }
                } else {
                    continue // Skip if no valid registration found
                }

                // Calculate status for each division when in "both" mode
                let divisionStatus: "pending" | "approved" | "rejected" | undefined
                let openStatus: "pending" | "approved" | "rejected" | undefined

                if (divisionMode === "both" && nonOpenReg && openReg) {
                    divisionStatus = nonOpenReg.status as "pending" | "approved" | "rejected"
                    openStatus = openReg.status as "pending" | "approved" | "rejected"
                }

                // Determine overall status
                // isApproved: true if ANY registration is approved
                // isRejected: true if ALL registrations are rejected (not just some)
                const allRejected = existing.length > 0 && existing.every(r => r.status === 'rejected')
                const anyApproved = existing.some(r => r.status === 'approved')

                // Determine modality mode based on existing registrations
                const fullRegs = existing.filter(r => r.tournament.modality === 'full')
                const benchRegs = existing.filter(r => r.tournament.modality === 'bench')
                let modalityMode: "full_only" | "bench_only" | "both_modalities" = "full_only"

                if (fullRegs.length > 0 && benchRegs.length > 0) {
                    modalityMode = "both_modalities"
                } else if (benchRegs.length > 0) {
                    modalityMode = "bench_only"
                } else {
                    modalityMode = "full_only"
                }

                initial[a.id] = {
                    athleteId: a.id,
                    tournamentId: baseTournamentId,
                    modality: mainReg.tournament.modality as any,
                    equipment: mainReg.tournament.equipment as any,
                    weightClass: mainReg.weightClass ?? "",
                    divisionMode,
                    modalityMode,
                    isApproved: anyApproved,
                    isRejected: allRejected,
                    isExisting: true,
                    divisionStatus,
                    openStatus,
                    paymentReceiptUrl: mainReg.paymentReceiptUrl
                }
            }
        }

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
                    prevEntry.divisionMode !== newEntry.divisionMode ||
                    prevEntry.isApproved !== newEntry.isApproved ||
                    prevEntry.isRejected !== newEntry.isRejected ||
                    prevEntry.divisionStatus !== newEntry.divisionStatus ||
                    prevEntry.openStatus !== newEntry.openStatus ||
                    prevEntry.modalityMode !== newEntry.modalityMode ||
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
                    divisionMode: "division_only",
                    modalityMode: matched.modality === "full" ? "full_only" : "bench_only",
                    isApproved: false,
                    isRejected: false,
                    isExisting: false,
                    divisionStatus: undefined,
                    openStatus: undefined
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
            if (!current) return prev

            // For approved athletes, only allow weight class changes
            if (current.isApproved) {
                if (updates.weightClass && Object.keys(updates).length === 1) {
                    return {
                        ...prev,
                        [athleteId]: { ...current, weightClass: updates.weightClass }
                    }
                }
                return prev // Block other updates for approved athletes
            }

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
            divisionMode: n.divisionMode,
            modalityMode: n.modalityMode
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

            const athleteDivision = getAthleteDivision(a.birthYear)

            return {
                ...a,
                entry,
                matched,
                plainAthlete,
                plainTournaments,
                athleteDivision
            }
        })
    }, [athletes, localNominations, event.tournaments])

    // Apply hideRegistered filter
    const filteredTableData = useMemo(() => {
        if (!hideRegistered) return tableData
        return tableData.filter(a => !a.entry)
    }, [tableData, hideRegistered])

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
                const entry = a.entry
                const isRejected = entry?.isRejected ?? false
                const hasPartialRejection = entry?.divisionMode === "both" &&
                    ((entry.divisionStatus === "rejected" && entry.openStatus !== "rejected") ||
                        (entry.openStatus === "rejected" && entry.divisionStatus !== "rejected"))

                return (
                    <div className="flex flex-col">
                        <span className={`font-semibold ${isRejected || hasPartialRejection ? "text-destructive" : ""}`}>
                            {a.fullName}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className={`text-md uppercase ${isRejected || hasPartialRejection ? "text-destructive" : "text-muted-foreground"}`}>
                                {a.gender} • {dayjs().year() - a.birthYear} años
                            </span>
                            {a.matched && (() => {
                                const athleteDivision = mapTournamentDivisionToAthleteDivision(
                                    a.matched.division,
                                    a.birthYear
                                )
                                const divisionLabel = getLabelFromValue(athleteDivision, ATHLETE_DIVISION)
                                return (
                                    <Badge variant="secondary" className="h-3.5 px-1 text-[8px] uppercase">
                                        {divisionLabel}
                                    </Badge>
                                )
                            })()}
                            {entry?.isApproved && (
                                <Badge variant="accent" className="h-3.5 px-1 text-[8px]">Aprobado</Badge>
                            )}
                            {isRejected && (
                                <Badge variant="secondary" className="h-3.5 px-1 text-[8px] bg-destructive text-destructive-foreground">
                                    Rechazado
                                </Badge>
                            )}
                            {hasPartialRejection && (
                                <div className="flex items-center gap-0.5">
                                    {entry.divisionStatus === "rejected" && (
                                        <Badge variant="secondary" className="h-3.5 px-1 text-[8px] bg-destructive text-destructive-foreground">
                                            Div. Rechazada
                                        </Badge>
                                    )}
                                    {entry.openStatus === "rejected" && (
                                        <Badge variant="secondary" className="h-3.5 px-1 text-[8px] bg-destructive text-destructive-foreground">
                                            Open Rechazada
                                        </Badge>
                                    )}
                                </div>
                            )}
                            {!a.matched && !entry && (
                                <span className="text-destructive font-bold text-[8px]">SIN TORNEO</span>
                            )}
                        </div>
                    </div>
                )
            },
            filterFn: "includesString"
        }),
        columnHelper.accessor(row => row.entry?.modalityMode || "full_only", {
            id: "modality",
            header: "Modalidad",
            cell: ({ row }) => {
                const a = row.original
                if (!a.entry) return null

                const availableModalities = getAvailableModalities(a.plainAthlete, a.plainTournaments)
                const currentModalityMode = a.entry.modalityMode

                // Check if both modalities are available for this athlete/equipment combination
                const hasFullOption = availableModalities.includes("full")
                const hasBenchOption = availableModalities.includes("bench")
                const hasBothModalities = hasFullOption && hasBenchOption

                // Build options based on what's available
                const options: Array<{ value: "full_only" | "bench_only" | "both_modalities", label: string }> = []

                if (hasFullOption) {
                    options.push({ value: "full_only", label: "Full Powerlifting" })
                }
                if (hasBenchOption) {
                    options.push({ value: "bench_only", label: "Bench Press" })
                }
                if (hasBothModalities) {
                    options.push({ value: "both_modalities", label: "Ambas" })
                }

                if (options.length === 0) return <span className="text-[9px] text-muted-foreground flex justify-center">-</span>
                if (options.length === 1) {
                    // Only one option, show as text
                    const singleOption = options[0]
                    if (!singleOption) return <span className="text-[9px] text-muted-foreground flex justify-center">-</span>
                    return <span className="text-xs text-muted-foreground text-center">{singleOption.label}</span>
                }

                return (
                    <div className="flex flex-col gap-0.5">
                        <Select
                            disabled={a.entry.isApproved}
                            value={currentModalityMode}
                            onValueChange={(val) => updateNomination(a.id, { modalityMode: val as "full_only" | "bench_only" | "both_modalities" })}
                        >
                            <SelectTrigger className="h-8 py-0 text-xs font-medium w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map(opt => (
                                    <SelectItem key={`${a.id}-modality-${opt.value}`} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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

                // If only one option, show plain text
                if (availableEquipment.length === 1) {
                    const label = EQUIPMENT.find(e => e.value === currentEquipment)?.label ?? currentEquipment
                    return <span className="text-xs text-muted-foreground">{label}</span>
                }

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
                if (!a.entry || !a.matched) return null

                const eligibleWeights = getEligibleWeightClasses(a.plainAthlete, a.matched)

                // If only one option, show plain text
                if (eligibleWeights.length === 1) {
                    const label = WEIGHT_CLASSES.find(wc => wc.value === eligibleWeights[0])?.label ?? eligibleWeights[0]
                    return <span className="text-xs text-muted-foreground">{label}</span>
                }

                return (
                    <Select
                        disabled={!a.entry || !a.matched}
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
        columnHelper.accessor("entry.divisionMode", {
            id: "division",
            header: "División",
            cell: ({ row }) => {
                const a = row.original
                if (!a.entry) return null

                const matched = a.matched
                if (!matched) return <span className="text-[9px] text-muted-foreground flex justify-center">-</span>

                const openCounterpart = getOpenCounterpart(matched, a.plainTournaments)
                const canEnterOpenAttr = canAthleteEnterOpen(a.plainAthlete)
                const hasOpenOption = !!openCounterpart && canEnterOpenAttr

                // Determine available options
                const athleteDivision = mapTournamentDivisionToAthleteDivision(
                    matched.division,
                    a.birthYear
                )
                const divisionLabel = getLabelFromValue(athleteDivision, ATHLETE_DIVISION)
                const options: Array<{ value: "division_only" | "open_only" | "both", label: string }> = []

                if (matched.division !== 'open') {
                    options.push({ value: "division_only", label: divisionLabel })
                    if (hasOpenOption) {
                        options.push({ value: "open_only", label: "Open" })
                        options.push({ value: "both", label: "Ambas" })
                    }
                } else {
                    // Matched tournament IS open, so always show Open option
                    options.push({ value: "open_only", label: "Open" })
                }

                if (options.length === 0) return <span className="text-[9px] text-muted-foreground flex justify-center">-</span>
                if (options.length === 1) {
                    // Only one option, show as text
                    const singleOption = options[0]
                    if (!singleOption) return <span className="text-[9px] text-muted-foreground flex justify-center">-</span>
                    return <span className="text-xs text-muted-foreground text-center">{singleOption.label}</span>
                }

                return (
                    <div className="flex flex-col gap-0.5">
                        <Select
                            disabled={a.entry.isApproved}
                            value={a.entry.divisionMode}
                            onValueChange={(val) => updateNomination(a.id, { divisionMode: val as "division_only" | "open_only" | "both" })}
                        >
                            <SelectTrigger className="h-8 py-0 text-xs font-medium w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map(opt => (
                                    <SelectItem key={`${a.id}-${opt.value}`} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(() => {
                            // Calculate total inscriptions based on divisionMode × modalityMode
                            const divisionCount = a.entry.divisionMode === "both" ? 2 : 1
                            const modalityCount = a.entry.modalityMode === "both_modalities" ? 2 : 1
                            const totalInscriptions = divisionCount * modalityCount

                            if (totalInscriptions === 2) {
                                return (
                                    <span className="text-[9px] text-muted-foreground mt-1">
                                        Doble inscripción
                                    </span>
                                )
                            } else if (totalInscriptions === 4) {
                                return (
                                    <span className="text-[9px] text-primary font-medium mt-1">
                                        Cuádruple inscripción
                                    </span>
                                )
                            }
                            return null
                        })()}
                    </div>
                )
            }
        }),
        columnHelper.display({
            id: "receipt",
            header: "Comprobante",
            cell: ({ row }) => {
                const a = row.original
                if (!a.entry) return null

                const receiptPath = a.entry.paymentReceiptUrl
                const isViewing = viewingReceiptAthleteId === a.id
                const isUploading = uploadingAthleteId === a.id

                // Has receipt - show view button
                if (receiptPath) {
                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleViewReceipt(a.id, receiptPath)}
                                disabled={isViewing || isUploading}
                                className={cn(
                                    "text-primary hover:underline flex items-center gap-1 text-xs",
                                    (isViewing || isUploading) && "opacity-50 cursor-wait"
                                )}
                            >
                                {isViewing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <FileText className="h-3 w-3" />
                                )}
                                Ver
                            </button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setDeleteConfirmAthleteId(a.id)}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <X className="h-3 w-3 text-destructive" />
                                )}
                            </Button>
                        </div>
                    )
                }

                // Event ended without receipt
                // if (isEventEnded) {
                //     return (
                //         <span className="text-muted-foreground text-xs italic">
                //             No disponible
                //         </span>
                //     )
                // }

                // No receipt yet - show upload button
                return (
                    <button
                        onClick={() => setUploadDialogAthleteId(a.id)}
                        disabled={isUploading}
                        className={cn(
                            "flex items-center gap-1 text-xs cursor-pointer hover:text-primary transition-colors",
                            isUploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Upload className="h-3 w-3" />
                        )}
                        <span>Subir</span>
                    </button>
                )
            }
        }),
        columnHelper.accessor("gender", { id: "gender", header: () => null, cell: () => null }),
        columnHelper.accessor(row => row.matched?.division, { id: "matchedDivision", header: () => null, cell: () => null }),
        columnHelper.accessor("athleteDivision", { id: "athleteDivision", header: () => null, cell: () => null }),
    ], [localNominations, event.tournaments, event.endDate, athletes, uploadingAthleteId, viewingReceiptAthleteId])

    const table = useReactTable({
        data: filteredTableData,
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
                            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
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
                                                        <Badge key={`modality-${modality}`} variant="secondary" className="text-xs py-0.5 px-2">
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
                                                        <Badge key={`equipment-${equipment}`} variant="secondary" className="text-xs py-0.5 px-2">
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
                                                        <Badge key={`division-${division}`} variant="secondary" className="text-xs py-0.5 px-2">
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

            {/* Event Description (based on affiliation) */}
            {eventDescription && (
                <div className="mb-4 p-4 bg-muted/30 border rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {eventDescription}
                    </p>
                </div>
            )}

            {/* Coaches Selection */}
            <EventCoachSelector event={event} className="mb-4" />

            {/* Search and Filters */}
            <div className="flex flex-col gap-3 bg-muted/30 p-4 rounded-lg border border-muted-foreground/10">
                {/* Search input - always full width */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar atleta por nombre..."
                        className="pl-9 h-9"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>

                {/* Filter dropdowns - responsive grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2">
                    <div className="col-span-2 sm:col-span-4 lg:hidden flex items-center gap-2 mb-1">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Filtros</span>
                    </div>
                    <Filter className="hidden lg:block h-4 w-4 text-muted-foreground" />

                    <Select
                        value={(table.getColumn("gender")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("gender")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-full lg:w-[120px] text-xs">
                            <SelectValue placeholder="Género" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Género: Todos</SelectItem>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={(table.getColumn("athleteDivision")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("athleteDivision")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-full lg:w-[130px] text-xs">
                            <SelectValue placeholder="División Atleta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">División: Todas</SelectItem>
                            {ATHLETE_DIVISION.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={(table.getColumn("modality")?.getFilterValue() as string) || "all"}
                        onValueChange={(val) => table.getColumn("modality")?.setFilterValue(val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-full lg:w-[140px] text-xs">
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
                        <SelectTrigger className="h-9 w-full lg:w-[130px] text-xs">
                            <SelectValue placeholder="Equipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Equipo: Todos</SelectItem>
                            {EQUIPMENT.map(e => (
                                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center gap-2 pt-2 lg:pt-0 lg:ml-2 lg:pl-2 lg:border-l border-t lg:border-t-0 border-muted-foreground/20">
                        <Switch
                            checked={hideRegistered}
                            onCheckedChange={setHideRegistered}
                            //@ts-ignore
                            size="sm"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Ocultar inscriptos</span>
                    </div>
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="h-64">
                                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">Cargando atletas...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
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
                                </>
                            )}
                        </tbody>
                    </table>
                </ScrollArea>
            </div>

            <div className="flex items-center justify-between w-full border-t pt-4 mt-auto">
                <div className="text-muted-foreground text-xs">
                    * Solo la <span className="text-accent font-bold underline">categoría de peso</span> puede ser modificada para atletas aprobados.
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


            {/* Upload Dialog with Drag & Drop */}
            <Dialog open={!!uploadDialogAthleteId} onOpenChange={(open) => !open && setUploadDialogAthleteId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Subir Comprobante de Pago</DialogTitle>
                    </DialogHeader>
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                        )}
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
                            if (file && uploadDialogAthleteId) {
                                handleFileUpload(uploadDialogAthleteId, file)
                                setUploadDialogAthleteId(null)
                            }
                        }}
                        onClick={() => {
                            const input = document.getElementById('upload-dialog-file-input') as HTMLInputElement
                            input?.click()
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id="upload-dialog-file-input"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && uploadDialogAthleteId) {
                                    handleFileUpload(uploadDialogAthleteId, file)
                                    setUploadDialogAthleteId(null)
                                }
                                e.target.value = '' // Reset input
                            }}
                        />
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
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteConfirmAthleteId} onOpenChange={(open) => !open && setDeleteConfirmAthleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar comprobante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El comprobante será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteConfirmAthleteId) {
                                    handleRemoveReceipt(deleteConfirmAthleteId)
                                    setDeleteConfirmAthleteId(null)
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
