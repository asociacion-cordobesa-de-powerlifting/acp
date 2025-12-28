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
import { athleteValidator } from "@acme/shared/validators"
import { RouterOutputs } from "@acme/api"

type Athlete = RouterOutputs["athletes"]["list"][number]

interface EditAthleteDialogProps {
    athlete: Athlete
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditAthleteDialog({ athlete, open, onOpenChange }: EditAthleteDialogProps) {
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateAthlete = useMutation(
        trpc.athletes.update.mutationOptions({
            onSuccess: async () => {
                toast.success("Atleta actualizado exitosamente")
                onOpenChange(false)
                router.refresh()
                await queryClient.invalidateQueries(trpc.athletes.list.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const form = useForm({
        defaultValues: {
            id: athlete.id,
            fullName: athlete.fullName,
            dni: athlete.dni,
            birthYear: athlete.birthYear ?? 2000,
            gender: athlete.gender as "M" | "F",
            squatBestKg: athlete.squatBestKg ?? 0,
            benchBestKg: athlete.benchBestKg ?? 0,
            deadliftBestKg: athlete.deadliftBestKg ?? 0,
        },
        validators: {
            onChange: athleteValidator as any, // casting to avoid minor type inference issues with refinement if any
        },
        onSubmit: ({ value }) => {
            updateAthlete.mutate({
                ...value,
                // Ensure correct types if needed
            } as any)
        },
    })

    // Reset form when athlete changes
    useEffect(() => {
        if (open) {
            form.reset({
                id: athlete.id,
                fullName: athlete.fullName,
                dni: athlete.dni,
                birthYear: athlete.birthYear ?? 2000,
                gender: athlete.gender as "M" | "F",
                squatBestKg: athlete.squatBestKg ?? 0,
                benchBestKg: athlete.benchBestKg ?? 0,
                deadliftBestKg: athlete.deadliftBestKg ?? 0,
            })
        }
    }, [athlete, open, form])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Atleta</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del atleta.
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
                            name="fullName"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Nombre Completo</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Ej: Maxi Zeballos"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="dni"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>DNI</FieldLabel>
                                            </FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Ej: 12345678"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />

                            <form.Field
                                name="birthYear"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Año de Nacimiento</FieldLabel>
                                            </FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="number"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                placeholder="Ej: 1995"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                        </div>

                        <form.Field
                            name="gender"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Género</FieldLabel>
                                        </FieldContent>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val: "M" | "F") => field.handleChange(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione género" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Masculino</SelectItem>
                                                <SelectItem value="F">Femenino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        <div className="pt-2">
                            <h4 className="text-sm font-medium mb-3">Mejores Marcas (Kg)</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <form.Field
                                    name="squatBestKg"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Sentadilla</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="number"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                    placeholder="Ej: 100"
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                                <form.Field
                                    name="benchBestKg"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Banca</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="number"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                    placeholder="Ej: 80"
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                                <form.Field
                                    name="deadliftBestKg"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Despegue</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="number"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                                                    placeholder="Ej: 120"
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 italic">
                                * Estos datos son aproximados y sirven para la organización inicial de los grupos.
                            </p>
                        </div>

                    </FieldGroup>
                    <DialogFooter>
                        <Button type="submit" disabled={updateAthlete.isPending}>
                            {updateAthlete.isPending && (
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
