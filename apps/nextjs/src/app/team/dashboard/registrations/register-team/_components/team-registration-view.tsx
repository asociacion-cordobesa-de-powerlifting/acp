"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, Search } from "lucide-react"
import { useTRPC } from "~/trpc/react"
import { EventNominationManager } from "../../../tournaments/_components/event-nomination-manager"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { Card, CardContent } from "@acme/ui/card"
import { dayjs } from "@acme/shared/libs"
import { useSearchParams } from "next/navigation"

export function TeamRegistrationView() {
    const trpc = useTRPC()
    const searchParams = useSearchParams()
    const { data: events = [], isLoading } = useQuery(trpc.tournaments.allEvents.queryOptions())
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

    // Pre-select event from URL param
    useEffect(() => {
        const eventIdParam = searchParams.get("eventId")
        if (eventIdParam && events.length > 0) {
            const eventExists = events.find(e => e.id === eventIdParam)
            if (eventExists) {
                setSelectedEventId(eventIdParam)
            }
        }
    }, [searchParams, events])

    const selectedEvent = events.find(e => e.id === selectedEventId)

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse text-sm">Cargando eventos...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                Seleccionar Evento
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Elije un evento del calendario para gestionar la nómina de tu equipo.
                            </p>
                        </div>
                        <div className="w-full md:w-[400px]">
                            <Select value={selectedEventId || "none"} onValueChange={(val) => setSelectedEventId(val === "none" ? null : val)}>
                                <SelectTrigger className="h-11 shadow-sm bg-background">
                                    <SelectValue placeholder="Seleccione un evento..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Seleccione un evento...</SelectItem>
                                    {events.map((e) => (
                                        <SelectItem key={e.id} value={e.id} className="py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold">{e.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {dayjs(e.startDate).format("D MMM, YYYY")} • {e.location}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedEvent ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <EventNominationManager
                        event={selectedEvent}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground space-y-4">
                    <div className="p-4 bg-muted/50 rounded-full border shadow-inner">
                        <Calendar className="h-10 w-10 opacity-30" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-medium text-lg">No hay evento seleccionado</p>
                        <p className="text-sm max-w-xs mx-auto">
                            Por favor selecciona un evento de la lista de arriba para comenzar a inscribir a tus atletas.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

