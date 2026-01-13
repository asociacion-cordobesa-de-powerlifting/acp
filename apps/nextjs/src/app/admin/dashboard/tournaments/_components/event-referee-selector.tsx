"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, X, Users, Scale } from "lucide-react"
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
import { Badge } from "@acme/ui/badge"
import { Label } from "@acme/ui/label"
import { REFEREE_CATEGORY } from "@acme/shared/constants"
import type { RouterOutputs } from "@acme/api"

type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]

interface EventRefereeSelectorProps {
    eventId: string
}

export function EventRefereeSelector({ eventId }: EventRefereeSelectorProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    // Fetch all referees
    const { data: allReferees = [], isLoading: isLoadingReferees } = useQuery(trpc.referees.list.queryOptions())
    // Fetch referees assigned to this event
    const { data: eventReferees = [], isLoading: isLoadingEventReferees } = useQuery(
        trpc.referees.byEvent.queryOptions({ eventId })
    )

    const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([])
    const [isSyncing, setIsSyncing] = useState(false)

    // Initialize selected referees from event data
    useEffect(() => {
        if (eventReferees.length > 0) {
            setSelectedRefereeIds(eventReferees.map(er => er.refereeId))
        } else {
            setSelectedRefereeIds([])
        }
    }, [eventReferees])

    const syncReferees = useMutation(
        trpc.referees.syncEventReferees.mutationOptions({
            onSuccess: async () => {
                toast.success("Referees actualizados")
                await queryClient.invalidateQueries(trpc.referees.byEvent.pathFilter())
                setIsSyncing(false)
            },
            onError: (err) => {
                toast.error(err.message)
                setIsSyncing(false)
            }
        })
    )

    const handleAddReferee = (refereeId: string) => {
        if (selectedRefereeIds.includes(refereeId)) return
        setSelectedRefereeIds(prev => [...prev, refereeId])
    }

    const handleRemoveReferee = (refereeId: string) => {
        setSelectedRefereeIds(prev => prev.filter(id => id !== refereeId))
    }

    const handleSave = () => {
        setIsSyncing(true)
        syncReferees.mutate({
            eventId,
            refereeIds: selectedRefereeIds
        })
    }

    const isLoading = isLoadingReferees || isLoadingEventReferees

    // Get referees not yet selected
    const availableReferees = allReferees.filter(r => !selectedRefereeIds.includes(r.id))

    // Check if there are changes to save
    const hasChanges = (() => {
        const currentIds = eventReferees.map(er => er.refereeId).sort()
        const newIds = [...selectedRefereeIds].sort()
        if (currentIds.length !== newIds.length) return true
        return currentIds.some((id, idx) => id !== newIds[idx])
    })()

    const categoryColorMap: Record<string, string> = {
        national: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        int_cat_1: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        int_cat_2: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    }

    if (isLoading) {
        return (
            <div className="pt-4 border-t">
                <Label className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Referees del Evento
                </Label>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-base flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Referees del Evento
                        {selectedRefereeIds.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {selectedRefereeIds.length}
                            </Badge>
                        )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Asignar referees que estarán en este evento.
                    </p>
                </div>
                {hasChanges && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSave}
                        disabled={isSyncing}
                        className="h-7 text-xs"
                    >
                        {isSyncing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Guardar Referees
                    </Button>
                )}
            </div>

            {allReferees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No hay referees registrados.{" "}
                    <a href="/admin/dashboard/referees" className="text-primary underline">
                        Agregar referees
                    </a>
                </p>
            ) : (
                <>
                    {/* Selected referees */}
                    {selectedRefereeIds.length > 0 && (
                        <div className="space-y-2">
                            {selectedRefereeIds.map(refereeId => {
                                const referee = allReferees.find(r => r.id === refereeId)
                                if (!referee) return null
                                const categoryInfo = REFEREE_CATEGORY.find(c => c.value === referee.category)
                                return (
                                    <div
                                        key={refereeId}
                                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{referee.fullName}</p>
                                        </div>
                                        <Badge className={categoryColorMap[referee.category] || ""} variant="secondary">
                                            {categoryInfo?.label || referee.category}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveReferee(refereeId)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Add referee dropdown */}
                    {availableReferees.length > 0 && (
                        <Select onValueChange={handleAddReferee}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Agregar referee..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableReferees.map(referee => {
                                    const categoryInfo = REFEREE_CATEGORY.find(c => c.value === referee.category)
                                    return (
                                        <SelectItem key={referee.id} value={referee.id} className="text-xs">
                                            {referee.fullName} ({categoryInfo?.label || referee.category})
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    )}
                </>
            )}
        </div>
    )
}
