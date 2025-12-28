"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus } from "lucide-react"
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
import { tournamentValidator } from "@acme/shared/validators"
import { DatePicker } from "~/app/_components/time-picker/picker"
import { tournamentStatusEnum } from "@acme/db/schema"
import { env } from "~/env"
import * as z from "zod/v4"
import { dayjs } from "@acme/shared/libs"

export function CreateTournamentDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createTournament = useMutation(
        trpc.tournaments.create.mutationOptions({
            onSuccess: async () => {
                toast.success("Torneo creado exitosamente")
                setOpen(false)
                form.reset()
                router.refresh()
                await queryClient.invalidateQueries(trpc.tournaments.list.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const defaultValues: z.input<typeof tournamentValidator> = {
        name: "",
        venue: "",
        location: "",
        maxAthletes: 0 as number | null,
        startDate: dayjs().toDate(),
        endDate: dayjs().toDate(),
        status: "preliminary_open" as const,
    }

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: tournamentValidator,
        },
        onSubmit: ({ value }) => {
            // Validator expects Date objects for dates, which DatePicker provides.
            // Zod schema expects dates.
            // However, verify if validator allows optional endDate. 
            // The validator in shared/validators.ts showed .required({...}) which might mean all keys in object are required unless logic says otherwise?
            // createInsertSchema usually makes nulllable columns optional. endDate is nullable in schema?
            // Checked schema: endDate: t.timestamp(), (nullable by default in drizzle output unless .notNull())
            // But validator.ts had .required({ ... endDate: true ... }). This overrides nullability?
            // Wait, createInsertSchema(table).required({...}) forces them to be required in the zod schema.
            // If so, I must provide them.
            createTournament.mutate({
                ...value,
                // Ensure types match what zod expects if form state diverges
            })
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Torneo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Torneo</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos para registrar un nuevo torneo.
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
                                                    <SelectItem value="draft">Borrador</SelectItem>
                                                    <SelectItem value="preliminary_open">Preliminar Abierto</SelectItem>
                                                    <SelectItem value="preliminary_closed">Preliminar Cerrado</SelectItem>
                                                    <SelectItem value="finished">Finalizado</SelectItem>
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
                        {
                            env.NODE_ENV === "development" && (
                                <Button type="button" onClick={() => console.log(form.state.errors)}>
                                    Mostrar errores en consola
                                </Button>
                            )
                        }
                        <Button type="submit" disabled={createTournament.isPending}>
                            {createTournament.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Crear
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
