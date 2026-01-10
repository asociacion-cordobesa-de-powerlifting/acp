"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@acme/ui/dialog"
import { Users } from "lucide-react"
import { RouterOutputs } from "@acme/api"
import { EventNominationManager } from "./event-nomination-manager"

type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]

interface EventNominationDialogProps {
    event: EventWithTournaments
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EventNominationDialog({
    event,
    open,
    onOpenChange
}: EventNominationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1100px] h-[90vh] flex flex-col p-6">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Nómina: {event.name}
                    </DialogTitle>
                    <DialogDescription>
                        Gestiona las inscripciones de todo tu equipo para este evento.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <EventNominationManager
                        event={event}
                        onSuccess={() => onOpenChange(false)}
                        onClose={() => onOpenChange(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
