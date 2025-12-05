import React from 'react'

export const Footer = () => {
  return (
    <footer className="bg-muted  py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-background/20">
            <div>
              <p className="font-semibold mb-2">
                © 2025 Asociación Cordobesa de Powerlifting
              </p>
              <p className="text-sm text-foreground/80">
                Todos los derechos reservados.
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/80 mb-2">Links útiles</p>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href="#"
                  className="text-foreground/90 hover:text-foreground transition"
                >
                  Políticas de privacidad
                </a>
                <a
                  href="#"
                  className="text-foreground/90 hover:text-foreground transition"
                >
                  Términos y condiciones
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm text-background/80 mb-2">Plataforma</p>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href="#"
                  className="text-foreground/90 hover:text-foreground transition"
                >
                  Documentación
                </a>
                <a
                  href="#"
                  className="text-foreground/90 hover:text-foreground transition"
                >
                  Soporte técnico
                </a>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-foreground/60">
            Plataforma de gestión de torneos de powerlifting
          </p>
        </div>
      </footer>
  )
}
