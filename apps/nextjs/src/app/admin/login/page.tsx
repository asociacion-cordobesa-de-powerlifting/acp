'use client';

import { useState } from 'react';
import { Button } from '@acme/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui/card';
import { Input } from '@acme/ui/input';
import { Label } from '@acme/ui/label';
import { LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Aquí irá la lógica de autenticación
    setTimeout(() => setIsLoading(false), 1000);
  };

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
            Administrador
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario Input */}
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="tu.usuario"
                  required
                  className="h-10 border-border focus:border-primary"
                />
              </div>

              {/* Contraseña Input */}
              <div className="space-y-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-10 border-border focus:border-primary"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-6"
              >
                {isLoading ? 'Cargando...' : 'Iniciar sesión'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-6 border-t border-border text-center text-sm">
              <p className="text-muted-foreground">
                ¿Eres un equipo?{' '}
                <a
                  href="/team/login"
                  className="text-accent hover:text-accent/80 font-medium transition"
                >
                  Ingresa aquí
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Plataforma oficial de ACP • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
