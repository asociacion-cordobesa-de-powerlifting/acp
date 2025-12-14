'use client';

import { MenuIcon } from 'lucide-react';

import { Sheet, SheetContent, SheetTrigger } from '@acme/ui/sheet';
import { ThemeToggle } from '@acme/ui/theme';
import { Button } from '@acme/ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Inicio', href: '#inicio' },
  { name: 'Torneos', href: '#torneos' },
  { name: 'Equipos', href: '#equipos' },
  { name: 'Cómo funciona', href: '#como-funciona' },
  { name: 'Contacto', href: '#contacto' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-card border-b border-border shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">ACP</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Asociación Cordobesa de Powerlifting
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-primary transition"
              >
                {item.name}
              </a>
            ))}

            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => (window.location.href = '/team/login')}
            >
              Iniciar sesión
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-6 mt-8">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium text-foreground hover:text-primary transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                  <Button
                    className="w-full"
                    onClick={() => (window.location.href = '/admin/login')}
                  >
                    Iniciar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}