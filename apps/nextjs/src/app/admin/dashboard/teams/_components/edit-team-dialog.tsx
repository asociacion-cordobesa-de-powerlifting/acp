"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Pencil } from "lucide-react"
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
import { toast } from "@acme/ui/toast"
import { authClient } from "~/auth/client"
import { useTRPC } from "~/trpc/react"

import { Switch } from "@acme/ui/switch"
import { Label } from "@acme/ui/label"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.email({
        message: "Email inválido.",
    }),
    newPassword: z.string().optional(),
})

interface EditTeamDialogProps {
    team: {
        id: string
        name: string
        email: string
        teamDataId?: string
        isAffiliated?: boolean
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps) {
    const [changePassword, setChangePassword] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isAffiliated, setIsAffiliated] = useState(team.isAffiliated ?? false)
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateTeam = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const promises = [];

            // Update basic info
            promises.push(authClient.admin.updateUser({
                userId: team.id,
                data: {
                    name: values.name,
                    email: values.email,
                },
            }));

            // Update password if enabled
            if (changePassword && values.newPassword) {
                promises.push(authClient.admin.setUserPassword({
                    userId: team.id,
                    newPassword: values.newPassword,
                }));
            }

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                // Join error messages if multiple
                throw new Error(errors.map(e => e.error?.message).join(", ") || "Error al actualizar el equipo");
            }

            return results[0]?.data; // Return first result usually fine
        },
        onSuccess: async () => {
            toast.success("Equipo actualizado exitosamente")
            onOpenChange(false)
            router.refresh()
            setChangePassword(false) // Reset state
            form.reset() // Reset form to clear password
            await queryClient.invalidateQueries(trpc.teams.list.pathFilter())
            await queryClient.invalidateQueries(trpc.teams.listWithTeamData.pathFilter())
        },
        onError: (err) => {
            toast.error(err.message)
        },
    })

    const updateAffiliation = useMutation(
        trpc.teams.update.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(trpc.teams.listWithTeamData.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
                setIsAffiliated(!isAffiliated) // Revert on error
            },
        })
    )

    const defaultValues: z.input<typeof formSchema> = {
        name: team.name,
        email: team.email,
        newPassword: "",
    }

    const form = useForm({
        defaultValues,
        validators: {
            onChange: formSchema,
        },
        onSubmit: ({ value }) => updateTeam.mutate(value),
    })

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setChangePassword(false);
                form.reset();
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Equipo</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del equipo.
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
                                            placeholder="Ej: Power Club"
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

                        <div className="flex items-center space-x-2 py-2">
                            <Switch
                                id="change-password"
                                checked={changePassword}
                                onCheckedChange={setChangePassword}
                            />
                            <Label htmlFor="change-password">Cambiar contraseña</Label>
                        </div>

                        {changePassword && (
                            <form.Field
                                name="newPassword"
                                validators={{
                                    onChange: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
                                }}
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid} className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Nueva Contraseña</FieldLabel>
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
                                                    autoComplete="new-password"
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
                        )}

                    </FieldGroup>

                    {team.teamDataId && (
                        <div className="flex items-center space-x-2 py-2 border-t pt-4">
                            <Switch
                                id="is-affiliated"
                                checked={isAffiliated}
                                onCheckedChange={(checked) => {
                                    setIsAffiliated(checked)
                                    updateAffiliation.mutate({
                                        teamId: team.teamDataId!,
                                        isAffiliated: checked,
                                    })
                                }}
                                disabled={updateAffiliation.isPending}
                            />
                            <Label htmlFor="is-affiliated">Equipo afiliado</Label>
                            {updateAffiliation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={updateTeam.isPending}>
                            {updateTeam.isPending && (
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
