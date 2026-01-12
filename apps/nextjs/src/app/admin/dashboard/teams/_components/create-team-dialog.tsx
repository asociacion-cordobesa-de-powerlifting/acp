"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Plus } from "lucide-react"
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
import { Switch } from "@acme/ui/switch"
import { Label } from "@acme/ui/label"
import { toast } from "@acme/ui/toast"

import { useTRPC } from "~/trpc/react"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Email inválido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
    isAffiliated: z.boolean(),
})

export function CreateTeamDialog() {
    const [open, setOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createTeam = useMutation(
        trpc.teams.create.mutationOptions({
            onSuccess: async () => {
                toast.success("Equipo creado exitosamente")
                setOpen(false)
                form.reset()
                router.refresh()
                await queryClient.invalidateQueries(trpc.teams.list.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
                console.error(err)
            },
        })
    )

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            isAffiliated: false,
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: ({ value }) => createTeam.mutate(value),
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Equipo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Equipo</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos para registrar un nuevo equipo.
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
                                            <FieldLabel htmlFor={field.name}>Nombre del Equipo</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Ej: Clover Team"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="email"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="email@ejemplo.com"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="password"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                                        </FieldContent>
                                        <div className="relative">
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type={showPassword ? "text" : "password"}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="******"
                                                aria-invalid={isInvalid}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />
                    </FieldGroup>

                    <form.Field
                        name="isAffiliated"
                        children={(field) => (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={field.name}
                                    checked={field.state.value}
                                    onCheckedChange={(checked: boolean) => field.handleChange(checked)}
                                />
                                <Label htmlFor={field.name}>Equipo afiliado</Label>
                            </div>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={createTeam.isPending}>
                            {createTeam.isPending && (
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
