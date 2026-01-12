"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

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

  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: LoginSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setIsPending(true);
      try {
        const { error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (error) {
          console.log(error)

          if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
            return formApi.setErrorMap({
              onSubmit: {
                fields: {
                  password: {
                    type: "manual",
                    message: "Contraseña incorrecta",
                  }
                }
              }
            })
          }

          if (error.code === "BANNED_USER") {
            return toast.error("Tu cuenta ha sido bloqueada. Ponte en contacto con el administrador", {
              position: "top-center"
            });
          }

          return toast.error(error.message || "Error al iniciar sesión");
        }

        toast.success("Sesión iniciada correctamente");
        router.push(redirectTo);
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Ocurrió un error inesperado");
      } finally {
        setIsPending(false);
      }
    },
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
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        className={cn("pr-10", inputClassName)}
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
                );
              }}
            />
          </FieldGroup>

          <Button
            type="submit"
            className={cn("w-full h-10 mt-6", submitButtonClassName)}
            disabled={isPending}
          >
            {isPending ? 'Cargando...' : submitButtonText}
          </Button>
        </form>

        {footerLink && (
          <div className="mt-6 pt-6 border-t border-border text-center text-sm">
            <p className="text-muted-foreground">
              {footerLink.text}{' '}
              <a
                href={footerLink.href}
                className="text-accent hover:text-accent/80 font-medium transition"
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