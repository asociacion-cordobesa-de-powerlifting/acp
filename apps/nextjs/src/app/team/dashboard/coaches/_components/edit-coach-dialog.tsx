"use client"

import { useState, useEffect } from "react"
import { Button } from "@acme/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@acme/ui/dialog"
import { Input } from "@acme/ui/input"
import { Label } from "@acme/ui/label"
import { Loader2 } from "lucide-react"
import { useTRPC } from "~/trpc/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@acme/ui/toast"
import type { RouterOutputs } from "@acme/api"

type Coach = RouterOutputs["coaches"]["list"][number]

interface EditCoachDialogProps {
    coach: Coach
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditCoachDialog({ coach, open, onOpenChange }: EditCoachDialogProps) {
    const [fullName, setFullName] = useState(coach.fullName)
    const [dni, setDni] = useState(coach.dni)

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    // Reset form when coach changes
    useEffect(() => {
        setFullName(coach.fullName)
        setDni(coach.dni)
    }, [coach])

    const updateCoach = useMutation(
        trpc.coaches.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Coach actualizado exitosamente")
                await queryClient.invalidateQueries(trpc.coaches.list.pathFilter())
                onOpenChange(false)
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateCoach.mutate({ id: coach.id, fullName, dni })
    }

    const isValid = fullName.trim() && dni.trim()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Coach</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del coach.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-fullName">Nombre completo</Label>
                            <Input
                                id="edit-fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Dennis Gonzalez"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-dni">DNI</Label>
                            <Input
                                id="edit-dni"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="12345678"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateCoach.isPending || !isValid}
                        >
                            {updateCoach.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
