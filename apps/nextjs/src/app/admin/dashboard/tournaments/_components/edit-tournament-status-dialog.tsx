"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@acme/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { Button } from "@acme/ui/button"
import { useTRPC } from "~/trpc/react"
import { TOURNAMENT_STATUS } from "@acme/shared/constants"
import { toast } from "@acme/ui/toast"
import { Loader2 } from "lucide-react"

interface EditTournamentStatusDialogProps {
    tournament: {
        id: string
        status: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTournamentStatusDialog({
    tournament,
    open,
    onOpenChange
}: EditTournamentStatusDialogProps) {
    const [status, setStatus] = useState(tournament.status)
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const updateStatus = useMutation(
        trpc.tournaments.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Estado del torneo actualizado")
                await queryClient.invalidateQueries(trpc.tournaments.allEvents.pathFilter())
                onOpenChange(false)
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Estado de la Modalidad</DialogTitle>
                    <DialogDescription>
                        Actualiza el estado actual de esta instancia competitiva.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {TOURNAMENT_STATUS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => updateStatus.mutate({ id: tournament.id, status: status as any })}
                        disabled={updateStatus.isPending}
                    >
                        {updateStatus.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
