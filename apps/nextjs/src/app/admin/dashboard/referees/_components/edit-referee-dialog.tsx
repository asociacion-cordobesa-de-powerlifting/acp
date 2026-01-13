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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { Input } from "@acme/ui/input"
import { Label } from "@acme/ui/label"
import { Loader2 } from "lucide-react"
import { useTRPC } from "~/trpc/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@acme/ui/toast"
import { REFEREE_CATEGORY } from "@acme/shared/constants"
import type { RouterOutputs } from "@acme/api"

type Referee = RouterOutputs["referees"]["list"][number]

interface EditRefereeDialogProps {
    referee: Referee
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditRefereeDialog({ referee, open, onOpenChange }: EditRefereeDialogProps) {
    const [fullName, setFullName] = useState(referee.fullName)
    const [dni, setDni] = useState(referee.dni)
    const [category, setCategory] = useState<string>(referee.category)

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    // Reset form when referee changes
    useEffect(() => {
        setFullName(referee.fullName)
        setDni(referee.dni)
        setCategory(referee.category)
    }, [referee])

    const updateReferee = useMutation(
        trpc.referees.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Referee actualizado exitosamente")
                await queryClient.invalidateQueries(trpc.referees.list.pathFilter())
                onOpenChange(false)
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateReferee.mutate({
            id: referee.id,
            fullName,
            dni,
            category: category as "national" | "int_cat_1" | "int_cat_2"
        })
    }

    const isValid = fullName.trim() && dni.trim() && category

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Referee</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del referee.
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
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REFEREE_CATEGORY.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            disabled={updateReferee.isPending || !isValid}
                        >
                            {updateReferee.isPending && (
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
