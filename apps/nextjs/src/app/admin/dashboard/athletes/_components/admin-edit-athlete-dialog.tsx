"use client"

import { useState, useEffect } from "react"
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

type AthleteWithTeam = RouterOutputs["athletes"]["listAll"][number]

interface AdminEditAthleteDialogProps {
    athlete: AthleteWithTeam
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AdminEditAthleteDialog({ athlete, open, onOpenChange }: AdminEditAthleteDialogProps) {
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // Get teams for the dropdown
    const { data: teams = [] } = useQuery(trpc.teams.listWithTeamData.queryOptions())

    const updateAthlete = useMutation(
        trpc.athletes.adminUpdate.mutationOptions({
            onSuccess: async () => {
                toast.success("Atleta actualizado exitosamente")
                onOpenChange(false)
                router.refresh()
                await queryClient.invalidateQueries(trpc.athletes.listAll.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const form = useForm({
        defaultValues: {
            id: athlete.id,
            teamId: athlete.teamId,
            fullName: athlete.fullName,
            dni: athlete.dni,
            birthYear: athlete.birthYear ?? 2000,
            gender: athlete.gender as "M" | "F",
            squatBestKg: athlete.squatBestKg ?? 0,
            benchBestKg: athlete.benchBestKg ?? 0,
            deadliftBestKg: athlete.deadliftBestKg ?? 0,
        },
        validators: {
            onChange: athleteValidator as any,
        },
        onSubmit: ({ value }) => {
            updateAthlete.mutate(value as any)
        },
    })

    // Reset form when athlete changes
    useEffect(() => {
        if (open) {
            form.reset({
                id: athlete.id,
                teamId: athlete.teamId,
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar Atleta</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del atleta. Puede cambiar el equipo asignado.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void form.handleSubmit()
                    }}
                    className="flex flex-col flex-1 overflow-hidden"
                >
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
                                                placeholder="Ej: Dennis Gonzalez"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />

                            <form.Field
                                name="teamId"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Equipo</FieldLabel>
                                            </FieldContent>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={(val) => field.handleChange(val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione equipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teams.map((team) => (
                                                        <SelectItem key={team.id} value={team.id}>
                                                            {team.user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                                    value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
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
                                                        value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
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
                                                        value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
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
                                                        value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
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
                            </div>

                        </FieldGroup>
                    </div>
                    <DialogFooter className="pt-4 border-t mt-4">
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
