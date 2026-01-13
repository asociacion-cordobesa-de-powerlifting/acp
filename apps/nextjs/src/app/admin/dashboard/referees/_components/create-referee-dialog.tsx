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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { Input } from "@acme/ui/input"
import { Label } from "@acme/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { useTRPC } from "~/trpc/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@acme/ui/toast"
import { REFEREE_CATEGORY } from "@acme/shared/constants"

export function CreateRefereeDialog() {
    const [open, setOpen] = useState(false)
    const [fullName, setFullName] = useState("")
    const [dni, setDni] = useState("")
    const [category, setCategory] = useState<string>("national")

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const createReferee = useMutation(
        trpc.referees.create.mutationOptions({
            onSuccess: async () => {
                toast.success("Referee creado exitosamente")
                await queryClient.invalidateQueries(trpc.referees.list.pathFilter())
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
        setCategory("national")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createReferee.mutate({
            fullName,
            dni,
            category: category as "national" | "int_cat_1" | "int_cat_2"
        })
    }

    const isValid = fullName.trim() && dni.trim() && category

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Referee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Agregar Referee</DialogTitle>
                        <DialogDescription>
                            Ingresa los datos del nuevo referee.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Nombre completo</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Dennis Gonzalez"
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
                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoría</Label>
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
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createReferee.isPending || !isValid}
                        >
                            {createReferee.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Crear Referee
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
