"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, UserPlus } from "lucide-react"
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
import { athleteValidator } from "@acme/shared/validators"

export function CreateAthleteDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createAthlete = useMutation(
        trpc.athletes.create.mutationOptions({
            onSuccess: async () => {
                toast.success("Atleta creado exitosamente")
                setOpen(false)
                form.reset()
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
            fullName: "",
            dni: "",
            birthYear: new Date().getFullYear() - 18,
            gender: "M" as "M" | "F",
        },
        validators: {
            onChange: athleteValidator,
        },
        onSubmit: ({ value }) => {
            createAthlete.mutate(value)
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Atleta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Atleta</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos del atleta para sumarlo a su equipo.
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

                    </FieldGroup>
                    <DialogFooter>
                        <Button type="submit" disabled={createAthlete.isPending}>
                            {createAthlete.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Registrar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
