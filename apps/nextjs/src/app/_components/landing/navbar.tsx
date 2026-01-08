'use client';

import { MenuIcon } from 'lucide-react';
import Image from 'next/image';

import { Sheet, SheetContent, SheetTrigger } from '@acme/ui/sheet';
import { Button } from '@acme/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@acme/ui';

const navigation = [
  { name: 'Inicio', href: '#inicio' },
  { name: 'Torneos', href: '#torneos' },
  { name: 'Equipos', href: '#equipos' },
  { name: 'Cómo funciona', href: '#como-funciona' },
  { name: 'Contacto', href: '#contacto' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Change navbar style after scrolling 100px
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/60 backdrop-blur-md shadow-sm'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <Image
                src="/acp-logo-transparent.webp"
                alt="ACP Logo"
                width={100}
                height={100}
                className="size-32 object-contain"
              />
              {/* <span
                className={cn(
                  'text-2xl font-bold transition-colors duration-300',
                  isScrolled ? 'text-primary' : 'text-white'
                )}
              >
                ACP
              </span>
              <span
                className={cn(
                  'text-xs hidden sm:inline transition-colors duration-300',
                  isScrolled ? 'text-gray-600' : 'text-white/80'
                )}
              >
                Asociación Cordobesa de Powerlifting
              </span> */}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  isScrolled
                    ? 'text-gray-700 hover:text-primary'
                    : 'text-white hover:text-white/80'
                )}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant={isScrolled ? 'outline' : 'secondary'}
              size="sm"
              className={cn(
                'hidden sm:inline-flex transition-all duration-300',
                !isScrolled && 'bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm'
              )}
              onClick={() => (window.location.href = '/team/login')}
            >
              Iniciar sesión
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'transition-colors duration-300',
                    !isScrolled && 'text-white hover:bg-white/10'
                  )}
                >
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