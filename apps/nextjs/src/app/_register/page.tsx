'use client';

import { LogIn } from 'lucide-react';

import RegisterForm from '~/app/_components/auth/register-form';

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-secondary p-4">
            <div className="w-full max-w-sm">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4">
                        <LogIn className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">ACP</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Registro
                    </p>
                </div>

                {/* Register Card */}
                <RegisterForm
                    title="Crear cuenta"
                    description="Registrar una nueva cuenta"
                    redirectTo="/admin/dashboard"
                    submitButtonText="Crear cuenta"
                    submitButtonClassName="bg-primary hover:bg-primary/90 text-primary-foreground"
                    inputClassName="focus-visible:border-primary focus-visible:ring-primary/50"
                />

                {/* Footer Text */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    Plataforma oficial de ACP • Todos los derechos reservados
                </p>
            </div>
        </div>
    );
}
