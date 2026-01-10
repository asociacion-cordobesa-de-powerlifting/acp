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
import { REGISTRATION_STATUS } from "@acme/shared/constants"
import { toast } from "@acme/ui/toast"
import { Loader2 } from "lucide-react"

interface BulkUpdateStatusDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    eventId?: string
}

export function BulkUpdateStatusDialog({
    open,
    onOpenChange,
    selectedIds,
    eventId
}: BulkUpdateStatusDialogProps) {
    const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending")
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const updateStatus = useMutation(
        trpc.registrations.updateStatusBulk.mutationOptions({
            onSuccess: async () => {
                toast.success(`${selectedIds.length} inscripción(es) actualizada(s)`)
                // Invalidate all registrations queries
                await queryClient.invalidateQueries(trpc.registrations.all.pathFilter())
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
                    <DialogTitle>Cambiar Estado de Inscripciones</DialogTitle>
                    <DialogDescription>
                        Actualizar el estado de {selectedIds.length} inscripción(es) seleccionada(s)
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={status} onValueChange={(value) => setStatus(value as any)}>
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
                        onClick={() => updateStatus.mutate({ ids: selectedIds, status })}
                        disabled={updateStatus.isPending}
                    >
                        {updateStatus.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Actualizar {selectedIds.length} Inscripción(es)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

