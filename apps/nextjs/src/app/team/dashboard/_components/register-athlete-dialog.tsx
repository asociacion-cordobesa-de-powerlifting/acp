"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
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
    DialogTrigger,
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
import { registrationValidator } from "@acme/shared/validators"
import { weightClassEnum, divisionEnum } from "@acme/db/schema"
import { getEligibleDivisions, getEligibleWeightClasses } from "@acme/shared"
import { ATHLETE_DIVISION, WEIGHT_CLASSES, EQUIPMENT } from "@acme/shared/constants"

interface RegisterAthleteToTournamentDialogProps {
    athleteId?: string;
    tournamentId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function RegisterAthleteToTournamentDialog({
    athleteId,
    tournamentId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger
}: RegisterAthleteToTournamentDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const open = controlledOpen ?? uncontrolledOpen
    const setOpen = controlledOnOpenChange ?? setUncontrolledOpen

    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // Queries to fill selects
    const { data: athletes } = useQuery(trpc.athletes.list.queryOptions());
    const { data: tournaments } = useQuery(trpc.tournaments.list.queryOptions());

    const createRegistration = useMutation(
        trpc.registrations.create.mutationOptions({
            onSuccess: async () => {
                toast.success("Inscripción creada exitosamente")
                setOpen(false)
                form.reset()
                router.refresh()
                // Invalidate query if exists
                // await queryClient.invalidateQueries(trpc.registrations.byTournament.pathFilter({ tournamentId }))
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const form = useForm({
        defaultValues: {
            athleteId: athleteId ?? "",
            tournamentId: tournamentId ?? "",
            weightClass: undefined as any,
            squatOpenerKg: 0 as number | null,
            benchOpenerKg: 0 as number | null,
            deadliftOpenerKg: 0 as number | null,
        },
        validators: {
            onChange: registrationValidator,
        },
        onSubmit: ({ value }) => {
            createRegistration.mutate(value)
        },
    })

    // Update default values if props change
    useEffect(() => {
        if (athleteId) form.setFieldValue("athleteId", athleteId);
        if (tournamentId) form.setFieldValue("tournamentId", tournamentId);
    }, [athleteId, tournamentId, form])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Inscribir Atleta a Torneo</DialogTitle>
                    <DialogDescription>
                        Complete los datos para la inscripción.
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
                        {/* TOURNAMENT SELECTOR */}
                        <form.Field
                            name="tournamentId"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Torneo</FieldLabel>
                                        </FieldContent>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val) => field.handleChange(val)}
                                            disabled={!!tournamentId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Torneo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tournaments?.map((t: any) => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        {/* ATHLETE SELECTOR */}
                        <form.Field
                            name="athleteId"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Atleta</FieldLabel>
                                        </FieldContent>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val) => field.handleChange(val)}
                                            disabled={!!athleteId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Atleta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {athletes?.map((a: any) => (
                                                    <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        <form.Subscribe
                            selector={(state) => [state.values.athleteId, state.values.tournamentId]}
                            children={([athleteId, tournamentId]) => {
                                const selectedAthlete = athletes?.find((a: any) => a.id === athleteId);
                                const selectedTournament = tournaments?.find((t: any) => t.id === tournamentId);

                                const division = selectedTournament?.division;
                                const event = selectedTournament?.event;
                                const equipment = selectedTournament?.equipment;

                                const divisionLabel = ATHLETE_DIVISION.find(ad => ad.value === division)?.label ?? division;
                                const eventLabel = EVENTS.find(e => e.value === event)?.label ?? event;
                                const equipmentLabel = EQUIPMENT.find(e => e.value === equipment)?.label ?? equipment;

                                const availableWeightClasses = !selectedAthlete?.gender || !division
                                    ? weightClassEnum.enumValues
                                    : getEligibleWeightClasses(selectedAthlete.gender as "M" | "F", division);

                                return (
                                    <>
                                        {selectedTournament && (
                                            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-sm mb-4">
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
                                        )}

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
                                                            onValueChange={(val) => field.handleChange(val)}
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
                                    </>
                                )
                            }}
                        />

                        {/* OPENERS */}
                        <form.Subscribe
                            selector={(state) => [state.values.tournamentId]}
                            children={([tournamentId]) => {
                                const selectedTournament = tournaments?.find((t: any) => t.id === tournamentId);
                                const event = selectedTournament?.event;

                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* SQUAT - Only if Full */}
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
                                                                    value={field.state.value ?? ""}
                                                                    onBlur={field.handleBlur}
                                                                    onChange={(e) => field.handleChange(Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber)}
                                                                    aria-invalid={isInvalid}
                                                                />
                                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                                            </Field>
                                                        )
                                                    }}
                                                />
                                            )}

                                            {/* BENCH - Always visible */}
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
                                                                onChange={(e) => field.handleChange(Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber)}
                                                                aria-invalid={isInvalid}
                                                            />
                                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                                        </Field>
                                                    )
                                                }}
                                            />

                                            {/* DEADLIFT - Only if Full */}
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
                                                                    value={field.state.value ?? ""}
                                                                    onBlur={field.handleBlur}
                                                                    onChange={(e) => field.handleChange(Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber)}
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
                                )
                            }}
                        />


                    </FieldGroup>
                    <DialogFooter>
                        <Button type="submit" disabled={createRegistration.isPending}>
                            {createRegistration.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Inscribir
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
