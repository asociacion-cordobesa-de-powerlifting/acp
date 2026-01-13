'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';

import LoginForm from '~/app/_components/auth/login-form';
import { authClient } from '~/auth/client';

export default function TeamLoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Redirect based on user role
      if (session.user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/team/dashboard');
      }
    }
  }, [session, router]);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-tertiary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in, don't render the login form (will redirect)
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-tertiary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

        {/* Back to Home Link */}
        <a
          href="/"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6"
        >
          ← Volver al inicio
        </a>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Plataforma oficial de ACP • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
