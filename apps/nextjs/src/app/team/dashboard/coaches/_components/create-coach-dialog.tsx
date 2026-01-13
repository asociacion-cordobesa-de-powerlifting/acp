"use client"

import { useState } from "react"
import { Button } from "@acme/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@acme/ui/dialog"
import { Input } from "@acme/ui/input"
import { Label } from "@acme/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { useTRPC } from "~/trpc/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@acme/ui/toast"

export function CreateCoachDialog() {
    const [open, setOpen] = useState(false)
    const [fullName, setFullName] = useState("")
    const [dni, setDni] = useState("")

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const createCoach = useMutation(
        trpc.coaches.create.mutationOptions({
            onSuccess: async () => {
                toast.success("Coach creado exitosamente")
                await queryClient.invalidateQueries(trpc.coaches.list.pathFilter())
                setOpen(false)
                resetForm()
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    const resetForm = () => {
        setFullName("")
        setDni("")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createCoach.mutate({ fullName, dni })
    }

    const isValid = fullName.trim() && dni.trim()

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Coach
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Agregar Coach</DialogTitle>
                        <DialogDescription>
                            Ingresa los datos del nuevo coach.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Nombre completo</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Juan Pérez"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input
                                id="dni"
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
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createCoach.isPending || !isValid}
                        >
                            {createCoach.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Crear Coach
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
