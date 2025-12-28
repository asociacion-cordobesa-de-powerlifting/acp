"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@acme/ui/button";
import RegisterForm from "~/app/_components/auth/register-form";
import { useRouter } from "next/navigation";
import { toast } from "@acme/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "~/auth/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { useForm } from "@tanstack/react-form";
import { Field, FieldContent, FieldLabel, FieldError, FieldGroup } from "@acme/ui/field";

const CreateUserSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    role: z.enum(["user", "admin", "team"]),
});

export default function CreateUserPage() {
    const router = useRouter();

    const createUser = useMutation({
        mutationFn: async (values: z.infer<typeof CreateUserSchema>) => {
            const { error } = await authClient.admin.createUser({
                email: values.email,
                password: values.password,
                name: values.name,
                role: values.role as any
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Usuario creado correctamente");
            router.push("/admin/dashboard/users");
            router.refresh();
        },
        onError: (err: any) => {
            toast.error(err.message || "Error al crear el usuario");
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "user" as "user" | "admin" | "team",
        },
        validators: {
            onSubmit: CreateUserSchema,
        },
        onSubmit: (data) => createUser.mutate(data.value),
    });

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/dashboard/users">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">Crear Usuario</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Usuario</CardTitle>
                    <CardDescription>
                        Ingresa la información del nuevo usuario. La contraseña será temporal o permanente según tu gestión.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void form.handleSubmit();
                        }}
                    >
                        <FieldGroup>
                            <form.Field
                                name="name"
                                children={(field) => (
                                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Nombre completo"
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="email"
                                children={(field) => (
                                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="usuario@ejemplo.com"
                                            type="email"
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="password"
                                children={(field) => (
                                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="••••••••"
                                            type="password"
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="role"
                                children={(field) => (
                                    <Field>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Rol</FieldLabel>
                                        </FieldContent>
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value as "user" | "admin" | "team")}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="user">Usuario</option>
                                            <option value="admin">Administrador</option>
                                            <option value="team">Equipo</option>
                                        </select>
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={createUser.isPending}>
                                {createUser.isPending ? "Creando..." : "Crear Usuario"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
