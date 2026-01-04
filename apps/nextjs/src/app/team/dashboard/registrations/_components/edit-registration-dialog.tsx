"use client"

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
import { getEligibleWeightClasses } from "@acme/shared"
import { TOURNAMENT_DIVISION, WEIGHT_CLASSES, EQUIPMENT } from "@acme/shared/constants"
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
        },
        validators: {
            onChange: updateRegistrationSchema,
        },
        onSubmit: ({ value }) => {
            updateRegistration.mutate(value)
        },
    })

    const division = registration.tournament.division;
    const equipment = registration.tournament.equipment;

    const divisionLabel = TOURNAMENT_DIVISION.find(ad => ad.value === division)?.label ?? division;
    const equipmentLabel = EQUIPMENT.find(e => e.value === equipment)?.label ?? equipment;

    const availableWeightClasses = !registration.athlete.gender || !division
        ? []
        : getEligibleWeightClasses(registration.athlete.gender as "M" | "F", registration.athlete.birthYear, division as any);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Inscripción</DialogTitle>
                    <DialogDescription>
                        Actualizar datos para {registration.athlete.fullName} en {(registration.tournament as any).event.name}.
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
                        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <div>
                                <p className="text-muted-foreground font-medium">División</p>
                                <p className="font-semibold">{divisionLabel}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">Equipamiento</p>
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
