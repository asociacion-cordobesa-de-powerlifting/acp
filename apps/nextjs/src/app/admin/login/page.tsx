'use client';

import { LogIn } from 'lucide-react';

import LoginForm from '~/app/_components/auth/login-form';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-accent-secondary p-4">
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-secondary mb-4">
            <LogIn className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ACP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administrador
          </p>
        </div>

        {/* Login Card */}
        <LoginForm
          title="Iniciar sesión"
          description="Ingresa tus credenciales para acceder a la plataforma"
          redirectTo="/admin/dashboard"
          submitButtonText="Iniciar sesión"
          submitButtonClassName="bg-secondary hover:bg-secondary/90 text-primary-foreground"
          inputClassName="focus-visible:border-secondary focus-visible:ring-secondary/50"
          footerLink={{
            text: "¿Eres un equipo?",
            href: "/team/login",
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
