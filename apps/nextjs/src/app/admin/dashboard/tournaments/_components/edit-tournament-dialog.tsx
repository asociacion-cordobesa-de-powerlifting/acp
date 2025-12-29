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
import { TOURNAMENT_STATUS, ATHLETE_DIVISION, EVENTS, EQUIPMENT } from "@acme/shared/constants"
import z from "zod/v4"
import { dayjs } from "@acme/shared/libs"

import { Switch } from "@acme/ui/switch"
import { Label } from "@acme/ui/label"

type Tournament = RouterOutputs["tournaments"]["all"][number]

interface EditTournamentDialogProps {
    tournament: Tournament
    open: boolean
    onOpenChange: (open: boolean) => void
}

const EditTournamentDialogSchema = tournamentValidator.and(z.object({
    id: z.uuid(),
    propagateLogistics: z.boolean().optional(),
}))

export function EditTournamentDialog({ tournament, open, onOpenChange }: EditTournamentDialogProps) {
    const isChild = !!tournament.parentId
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateTournament = useMutation(
        trpc.tournaments.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Torneo actualizado exitosamente")
                onOpenChange(false)
                router.refresh()
                await queryClient.invalidateQueries(trpc.tournaments.all.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const defaultValues: z.input<typeof EditTournamentDialogSchema> = {
        id: tournament.id,
        name: tournament.name,
        venue: tournament.venue,
        location: tournament.location,
        maxAthletes: tournament.maxAthletes,
        startDate: tournament.startDate ? dayjs(tournament.startDate).toDate() : dayjs().toDate(),
        endDate: tournament.endDate ? dayjs(tournament.endDate).toDate() : dayjs().toDate(),
        status: tournament.status,
        division: tournament.division as any,
        event: tournament.event as any,
        equipment: tournament.equipment as any,
        propagateLogistics: false,
    }

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: EditTournamentDialogSchema,
        },
        onSubmit: ({ value }) => {
            updateTournament.mutate(value)
        },
    })

    // Reset form when tournament prop changes
    useEffect(() => {
        if (open) {
            form.reset(defaultValues)
        }
    }, [tournament, open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Editar {isChild ? 'Instancia de Modalidad' : 'Torneo Principal'}</DialogTitle>
                    <DialogDescription>
                        {isChild
                            ? "Los campos logísticos están bloqueados porque se heredan del torneo principal."
                            : "Modifique los datos del torneo principal."}
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
                                            <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Ej: Campeonato Nacional 2025"
                                            aria-invalid={isInvalid}
                                            disabled={isChild}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        {!isChild && (
                            <form.Field
                                name="propagateLogistics"
                                children={(field) => (
                                    <div className="flex items-center space-x-2 py-2">
                                        <Switch
                                            id={field.name}
                                            checked={field.state.value}
                                            onCheckedChange={field.handleChange}
                                        />
                                        <Label htmlFor={field.name} className="text-sm font-medium leading-none cursor-pointer">
                                            Propagar cambios logísticos a todas las modalidades
                                        </Label>
                                    </div>
                                )}
                            />
                        )}

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
                                                disabled={isChild}
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
                                                disabled={isChild}
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
                                                label="Seleccionar fecha"
                                                disabled={isChild}
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
                                                label="Seleccionar fecha"
                                                disabled={isChild}
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

                        <div className="grid grid-cols-3 gap-4">
                            <form.Field
                                name="division"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>División</FieldLabel>
                                            </FieldContent>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={(val: any) => field.handleChange(val)}
                                                disabled={isChild}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="División" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ATHLETE_DIVISION.map(d => (
                                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                            <form.Field
                                name="event"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Evento</FieldLabel>
                                            </FieldContent>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={(val: any) => field.handleChange(val)}
                                                disabled={isChild}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Evento" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EVENTS.map(e => (
                                                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                            <form.Field
                                name="equipment"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Equipamiento</FieldLabel>
                                            </FieldContent>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={(val: any) => field.handleChange(val)}
                                                disabled={isChild}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Equipamiento" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EQUIPMENT.map(e => (
                                                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
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
