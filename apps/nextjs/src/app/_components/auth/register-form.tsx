"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { authClient } from "~/auth/client";

const RegisterSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

interface RegisterFormProps {
    title?: string;
    description?: string;
    redirectTo?: string;
    submitButtonText?: string;
    className?: string;
    submitButtonClassName?: string;
    inputClassName?: string;
}

export default function RegisterForm({
    title = "Crear cuenta",
    description = "Ingresa tus datos para registrarte",
    redirectTo = "/",
    submitButtonText = "Registrarse",
    className,
    submitButtonClassName,
    inputClassName,
}: RegisterFormProps) {
    const router = useRouter();

    const register = useMutation({
        mutationFn: async (values: z.infer<typeof RegisterSchema>) => {
            const { error } = await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Cuenta creada correctamente");
            // router.push(redirectTo);
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message || "Error al crear la cuenta");
            console.log('error', err)
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
        validators: {
            onSubmit: RegisterSchema,
        },
        onSubmit: (data) => register.mutate(data.value),
    });

    return (
        <Card className={cn("border-0 shadow-lg", className)}>
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>
                    {description}
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
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="Tu nombre"
                                            type="text"
                                            className={inputClassName}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
                        />
                        <form.Field
                            name="email"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid;
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
                                            aria-invalid={isInvalid}
                                            placeholder="tu@email.com"
                                            type="email"
                                            className={inputClassName}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
                        />
                        <form.Field
                            name="password"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="••••••••"
                                            type="password"
                                            className={inputClassName}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
                        />
                    </FieldGroup>

                    <Button
                        type="submit"
                        className={cn("w-full h-10 mt-6", submitButtonClassName)}
                        disabled={register.isPending}
                    >
                        {register.isPending ? 'Cargando...' : submitButtonText}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
