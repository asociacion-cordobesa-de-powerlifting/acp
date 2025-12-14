"use client"

import { useState, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

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
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@acme/ui/field"
import { Input } from "@acme/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { toast } from "@acme/ui/toast"
import { useTRPC } from "~/trpc/react"
import { tournamentValidator } from "@acme/shared/validators"
import { DatePicker } from "~/app/_components/time-picker/picker"
import { RouterOutputs } from "@acme/api"
import { TOURNAMENT_STATUS } from "@acme/shared/constants"

type Tournament = RouterOutputs["tournaments"]["list"][number]

interface EditTournamentDialogProps {
    tournament: Tournament
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTournamentDialog({ tournament, open, onOpenChange }: EditTournamentDialogProps) {
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateTournament = useMutation(
        trpc.tournaments.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Torneo actualizado exitosamente")
                onOpenChange(false)
                router.refresh()
                await queryClient.invalidateQueries(trpc.tournaments.list.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const form = useForm({
        defaultValues: {
            id: tournament.id,
            name: tournament.name,
            venue: tournament.venue,
            location: tournament.location,
            maxAthletes: tournament.maxAthletes,
            startDate: tournament.startDate ? new Date(tournament.startDate) : new Date(),
            endDate: tournament.endDate ? new Date(tournament.endDate) : new Date(),
            status: tournament.status ?? "draft",
        },
        validators: {
            onChange: tournamentValidator as any,
        },
        onSubmit: ({ value }) => {
            updateTournament.mutate({
                ...value,
                // Ensure ID is passed and types align
            } as any)
        },
    })

    // Reset form when tournament prop changes
    useEffect(() => {
        if (open) {
            form.reset({
                id: tournament.id,
                name: tournament.name,
                venue: tournament.venue,
                location: tournament.location,
                maxAthletes: tournament.maxAthletes,
                startDate: tournament.startDate ? new Date(tournament.startDate) : new Date(),
                endDate: tournament.endDate ? new Date(tournament.endDate) : new Date(),
                status: tournament.status ?? "draft",
            })
        }
    }, [tournament, open, form])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Editar Torneo</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del torneo.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void form.handleSubmit()
                    }}
                    className="space-y-4"
                >
                    <FieldGroup>
                        <form.Field
                            name="name"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Nombre del Torneo</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Ej: Campeonato Nacional 2025"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="venue"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Sede</FieldLabel>
                                            </FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Ej: Hotel portal del lago"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                            <form.Field
                                name="location"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Ubicación</FieldLabel>
                                            </FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Ej: Villa Carlos Paz, Córdoba, Argentina"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="startDate"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid} className="flex flex-col">
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Fecha de Inicio</FieldLabel>
                                            </FieldContent>
                                            <DatePicker
                                                date={field.state.value}
                                                setDate={(date) => field.handleChange(date as Date)}
                                                label="Seleccionar fecha inicio"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                            <form.Field
                                name="endDate"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid} className="flex flex-col">
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Fecha de Fin</FieldLabel>
                                            </FieldContent>
                                            <DatePicker
                                                date={field.state.value}
                                                setDate={(date) => field.handleChange(date as Date)}
                                                label="Seleccionar fecha fin"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="maxAthletes"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Max. Atletas</FieldLabel>
                                            </FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="number"
                                                value={field.state.value ?? ""}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    const val = e.target.valueAsNumber;
                                                    field.handleChange(isNaN(val) ? null : val)
                                                }}
                                                placeholder="0"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                            <form.Field
                                name="status"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                                            </FieldContent>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={(val: any) => field.handleChange(val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TOURNAMENT_STATUS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                        </div>

                    </FieldGroup>
                    <DialogFooter>
                        <Button type="submit" disabled={updateTournament.isPending}>
                            {updateTournament.isPending && (
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
