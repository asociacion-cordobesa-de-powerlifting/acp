"use client"

import { useState, useEffect } from "react"
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
import { REGISTRATION_STATUS } from "@acme/shared/constants"
import { toast } from "@acme/ui/toast"
import { Loader2 } from "lucide-react"
import { RouterOutputs } from "@acme/api"

type Registration = RouterOutputs["registrations"]["byEvent"][number]

interface UpdateRegistrationStatusDialogProps {
    registration: Registration
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
}

export function UpdateRegistrationStatusDialog({
    registration,
    open,
    onOpenChange,
    eventId
}: UpdateRegistrationStatusDialogProps) {
    const [status, setStatus] = useState(registration.status)
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (open) {
            setStatus(registration.status)
        }
    }, [open, registration.status])

    const updateStatus = useMutation(
        trpc.registrations.updateStatus.mutationOptions({
            onSuccess: async () => {
                toast.success("Estado de inscripción actualizado")
                await queryClient.invalidateQueries(trpc.registrations.byEvent.pathFilter({ eventId }))
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
                    <DialogTitle>Cambiar Estado de Inscripción</DialogTitle>
                    <DialogDescription>
                        Actualizar el estado de la inscripción de {registration.athlete.fullName}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {REGISTRATION_STATUS.map((s) => (
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
                        onClick={() => updateStatus.mutate({ id: registration.id, status: status as any })}
                        disabled={updateStatus.isPending || status === registration.status}
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

