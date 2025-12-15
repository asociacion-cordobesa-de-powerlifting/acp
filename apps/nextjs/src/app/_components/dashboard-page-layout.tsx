import React from "react";
import { Separator } from "@acme/ui/separator";

interface DashboardPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /**
   * Un nodo de React para renderizar acciones, como botones o links.
   * Se mostrará en la parte superior derecha de la cabecera.
   */
  actions?: React.ReactNode;
}

export function DashboardPageLayout({
  title,
  description,
  actions,
  children,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Cabecera: Ahora usa flexbox para alinear título y acciones */}
      <div className="flex shrink-0 items-center justify-between">
        {/* Contenedor para el título y la descripción */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Contenedor para las acciones, solo se renderiza si existen */}
        {actions && (
          <div className="flex items-center gap-x-2">{actions}</div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Contenido con Scroll (sin cambios) */}
      <div className="mb-6">
        {children}
      </div>
    </div>
  );
}