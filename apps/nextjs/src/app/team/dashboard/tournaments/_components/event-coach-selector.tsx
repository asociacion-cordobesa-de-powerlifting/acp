"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, UserPlus, X, Users } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card"
import { COACH_ROLE } from "@acme/shared/constants"
import type { RouterOutputs } from "@acme/api"

type Coach = RouterOutputs["coaches"]["list"][number]
type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]

interface CoachEntry {
    coachId: string
    role: "head_coach" | "assistant_coach"
}

interface EventCoachSelectorProps {
    event: EventWithTournaments
    className?: string
}

export function EventCoachSelector({ event, className }: EventCoachSelectorProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    // Fetch team's coaches
    const { data: coaches = [], isLoading: isLoadingCoaches } = useQuery(trpc.coaches.list.queryOptions())
    // Fetch coaches already registered to this event
    const { data: eventCoaches = [], isLoading: isLoadingEventCoaches } = useQuery(
        trpc.coaches.byEvent.queryOptions({ eventId: event.id })
    )

    const [selectedCoaches, setSelectedCoaches] = useState<CoachEntry[]>([])
    const [isSyncing, setIsSyncing] = useState(false)

    // Initialize selected coaches from event data
    useEffect(() => {
        if (eventCoaches.length > 0) {
            const entries: CoachEntry[] = eventCoaches.map(ec => ({
                coachId: ec.coachId,
                role: ec.role as "head_coach" | "assistant_coach"
            }))
            setSelectedCoaches(entries)
        }
    }, [eventCoaches])

    const syncCoaches = useMutation(
        trpc.coaches.syncEventCoaches.mutationOptions({
            onSuccess: async () => {
                toast.success("Coaches actualizados")
                await queryClient.invalidateQueries(trpc.coaches.byEvent.pathFilter())
                setIsSyncing(false)
            },
            onError: (err) => {
                toast.error(err.message)
                setIsSyncing(false)
            }
        })
    )

    const handleAddCoach = (coachId: string) => {
        if (selectedCoaches.some(c => c.coachId === coachId)) return
        setSelectedCoaches(prev => [...prev, { coachId, role: "head_coach" }])
    }

    const handleRemoveCoach = (coachId: string) => {
        setSelectedCoaches(prev => prev.filter(c => c.coachId !== coachId))
    }

    const handleRoleChange = (coachId: string, role: "head_coach" | "assistant_coach") => {
        setSelectedCoaches(prev => prev.map(c =>
            c.coachId === coachId ? { ...c, role } : c
        ))
    }

    const handleSave = () => {
        setIsSyncing(true)
        syncCoaches.mutate({
            eventId: event.id,
            coaches: selectedCoaches
        })
    }

    const isLoading = isLoadingCoaches || isLoadingEventCoaches

    // Get coaches not yet selected
    const availableCoaches = coaches.filter(c => !selectedCoaches.some(sc => sc.coachId === c.id))

    // Check if there are changes to save
    const hasChanges = (() => {
        if (selectedCoaches.length !== eventCoaches.length) return true
        return selectedCoaches.some(sc => {
            const existing = eventCoaches.find(ec => ec.coachId === sc.coachId)
            return !existing || existing.role !== sc.role
        })
    })()

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Coaches del Evento
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Coaches del Evento
                        {selectedCoaches.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {selectedCoaches.length}
                            </Badge>
                        )}
                    </CardTitle>
                    {hasChanges && (
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSyncing}
                            className="h-7 text-xs"
                        >
                            {isSyncing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Guardar
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="py-3 px-4 space-y-3">
                {coaches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No tienes coaches registrados.{" "}
                        <a href="/team/dashboard/coaches" className="text-primary underline">
                            Agregar coaches
                        </a>
                    </p>
                ) : (
                    <>
                        {/* Selected coaches */}
                        {selectedCoaches.length > 0 && (
                            <div className="space-y-2">
                                {selectedCoaches.map(entry => {
                                    const coach = coaches.find(c => c.id === entry.coachId)
                                    if (!coach) return null
                                    return (
                                        <div
                                            key={entry.coachId}
                                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{coach.fullName}</p>
                                                <p className="text-xs text-muted-foreground">DNI: {coach.dni}</p>
                                            </div>
                                            <Select
                                                value={entry.role}
                                                onValueChange={(val) => handleRoleChange(entry.coachId, val as any)}
                                            >
                                                <SelectTrigger className="h-7 w-[140px] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COACH_ROLE.map(r => (
                                                        <SelectItem key={r.value} value={r.value} className="text-xs">
                                                            {r.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveCoach(entry.coachId)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Add coach dropdown */}
                        {availableCoaches.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Select onValueChange={handleAddCoach}>
                                    <SelectTrigger className="flex-1 h-8 text-xs">
                                        <SelectValue placeholder="Agregar coach..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCoaches.map(coach => (
                                            <SelectItem key={coach.id} value={coach.id} className="text-xs">
                                                {coach.fullName} (DNI: {coach.dni})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={availableCoaches.length === 0}
                                >
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {selectedCoaches.length === 0 && availableCoaches.length > 0 && (
                            <p className="text-xs text-muted-foreground text-center">
                                Selecciona los coaches que asistirán a este evento
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
