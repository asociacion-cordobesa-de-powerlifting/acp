
"use client"

import { useState } from "react"
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
import { updateRegistrationSchema } from "@acme/shared/validators"
import { weightClassEnum, divisionEnum } from "@acme/db/schema"
import { getEligibleDivisions, getEligibleWeightClasses } from "@acme/shared"
import { ATHLETE_DIVISION, WEIGHT_CLASSES, EVENTS, EQUIPMENT } from "@acme/shared/constants"
import { RouterOutputs } from "@acme/api"

// Helper type
type Registration = RouterOutputs["registrations"]["byTeam"][number]

interface EditRegistrationDialogProps {
    registration: Registration;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditRegistrationDialog({
    registration,
    open,
    onOpenChange,
}: EditRegistrationDialogProps) {
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateRegistration = useMutation(
        trpc.registrations.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Inscripción actualizada exitosamente")
                onOpenChange(false)
                router.refresh()
                // Invalidate query
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const form = useForm({
        defaultValues: {
            id: registration.id,
            weightClass: registration.weightClass,
            squatOpenerKg: registration.squatOpenerKg,
            benchOpenerKg: registration.benchOpenerKg,
            deadliftOpenerKg: registration.deadliftOpenerKg,
        },
        validators: {
            onChange: updateRegistrationSchema,
        },
        onSubmit: ({ value }) => {
            updateRegistration.mutate(value)
        },
    })

    const division = registration.tournament.division;
    const event = registration.tournament.event;
    const equipment = registration.tournament.equipment;

    const divisionLabel = ATHLETE_DIVISION.find(ad => ad.value === division)?.label ?? division;
    const eventLabel = EVENTS.find(e => e.value === event)?.label ?? event;
    const equipmentLabel = EQUIPMENT.find(e => e.value === equipment)?.label ?? equipment;

    const availableWeightClasses = !registration.athlete.gender || !division
        ? weightClassEnum.enumValues
        : getEligibleWeightClasses(registration.athlete.gender as "M" | "F", division);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Inscripción</DialogTitle>
                    <DialogDescription>
                        Actualizar datos para {registration.athlete.fullName} en {registration.tournament.name}.
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
                        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <div>
                                <p className="text-muted-foreground font-medium">División</p>
                                <p className="font-semibold">{divisionLabel}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Evento</p>
                                <p className="font-semibold">{eventLabel}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Modalidad</p>
                                <p className="font-semibold">{equipmentLabel}</p>
                            </div>
                        </div>

                        {/* WEIGHT CLASS SELECTOR */}
                        <form.Field
                            name="weightClass"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Categoría de Peso</FieldLabel>
                                        </FieldContent>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val) => field.handleChange(val as any)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableWeightClasses.map(w => {
                                                    const label = WEIGHT_CLASSES.find(wc => wc.value === w)?.label ?? w;
                                                    return (
                                                        <SelectItem key={w} value={w}>{label}</SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {event === 'full' && (
                                    <form.Field
                                        name="squatOpenerKg"
                                        children={(field) => {
                                            const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                            return (
                                                <Field data-invalid={isInvalid}>
                                                    <FieldContent>
                                                        <FieldLabel htmlFor={field.name}>Opener Sentadilla (Kg)</FieldLabel>
                                                    </FieldContent>
                                                    <Input
                                                        id={field.name}
                                                        name={field.name}
                                                        type="number"
                                                        value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
                                                        onBlur={field.handleBlur}
                                                        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                        aria-invalid={isInvalid}
                                                    />
                                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                                </Field>
                                            )
                                        }}
                                    />
                                )}

                                {/* BANCO ALWAYS */}
                                <form.Field
                                    name="benchOpenerKg"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Opener Banco (Kg)</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="number"
                                                    value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />

                                {event === 'full' && (
                                    <form.Field
                                        name="deadliftOpenerKg"
                                        children={(field) => {
                                            const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                            return (
                                                <Field data-invalid={isInvalid}>
                                                    <FieldContent>
                                                        <FieldLabel htmlFor={field.name}>Opener Despegue (Kg)</FieldLabel>
                                                    </FieldContent>
                                                    <Input
                                                        id={field.name}
                                                        name={field.name}
                                                        type="number"
                                                        value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
                                                        onBlur={field.handleBlur}
                                                        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                        aria-invalid={isInvalid}
                                                    />
                                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                                </Field>
                                            )
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updateRegistration.isPending}>
                            {updateRegistration.isPending && (
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
