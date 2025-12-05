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

const LoginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

interface LoginFormProps {
  title?: string;
  description?: string;
  redirectTo?: string;
  submitButtonText?: string;
  className?: string;
  submitButtonClassName?: string;
  inputClassName?: string;
  footerLink?: {
    text: string;
    href: string;
    linkText: string;
  };
}

export default function LoginForm({
  title = "Iniciar sesión",
  description = "Ingresa tus credenciales para acceder a la plataforma",
  redirectTo = "/",
  submitButtonText = "Iniciar sesión",
  className,
  submitButtonClassName,
  inputClassName,
  footerLink,
}: LoginFormProps) {
  const router = useRouter();

  const login = useMutation({
    mutationFn: async (values: z.infer<typeof LoginSchema>) => {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sesión iniciada correctamente");
      router.push(redirectTo);
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message || "Error al iniciar sesión");
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: LoginSchema,
    },
    onSubmit: (data) => login.mutate(data.value),
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
            disabled={login.isPending}
          >
            {login.isPending ? 'Cargando...' : submitButtonText}
          </Button>
        </form>

        {footerLink && (
          <div className="mt-6 pt-6 border-t border-border text-center text-sm">
            <p className="text-muted-foreground">
              {footerLink.text}{' '}
              <a
                href={footerLink.href}
                className="text-tertiary hover:text-tertiary/80 font-medium transition"
              >
                {footerLink.linkText}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}