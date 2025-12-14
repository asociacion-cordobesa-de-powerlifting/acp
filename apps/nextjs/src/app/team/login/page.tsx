'use client';

import { Users } from 'lucide-react';

import LoginForm from '~/app/_components/auth/login-form';

export default function TeamLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-tertiary p-4">
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4">
            <Users className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ACP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Equipos y Entrenadores
          </p>
        </div>

        {/* Login Card */}
        <LoginForm
          title="Iniciar sesión"
          description="Ingresa tus credenciales para acceder a la plataforma"
          redirectTo="/team/dashboard"
          submitButtonText="Iniciar sesión"
          submitButtonClassName="bg-primary hover:bg-primary/90 text-accent-foreground"
          inputClassName="focus-visible:border-primary focus-visible:ring-primary/50"
          footerLink={{
            text: "¿Eres administrador?",
            href: "/admin/login",
            linkText: "Ingresa aquí",
          }}
        />

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Plataforma oficial de ACP • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
