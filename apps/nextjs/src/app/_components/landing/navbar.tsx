'use client';

import { MenuIcon, HomeIcon, TrophyIcon, InfoIcon, MailIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@acme/ui/sheet';
import { Button } from '@acme/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@acme/ui';

const navigation = [
  { name: 'Inicio', section: 'inicio', icon: HomeIcon },
  { name: 'Torneos', section: 'torneos', icon: TrophyIcon },
  // { name: 'Equipos', section: 'equipos' },
  { name: 'Cómo funciona', section: 'como-funciona', icon: InfoIcon },
  { name: 'Contacto', section: 'contacto', icon: MailIcon },
];

interface NavbarProps {
  session?: {
    user: {
      id: string;
      name: string;
      role?: string | null;
    };
  } | null;
}

export default function Navbar({ session }: NavbarProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Check if we're on the landing page
  const isLandingPage = pathname === '/';

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

  // Get the correct href for navigation items
  const getNavHref = (section: string) => {
    // Always use absolute path to landing page with anchor
    return `/#${section}`;
  };

  // Determine dashboard URL based on role
  const getDashboardUrl = () => {
    if (session?.user.role === 'admin') {
      return '/admin/dashboard';
    }
    return '/team/dashboard';
  };

  const getLoginUrl = () => {
    return '/team/login';
  };

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
          <a href="/" className="shrink-0">
            <div className="flex items-center gap-3">
              <Image
                src="/acp-logo-transparent.webp"
                alt="ACP Logo"
                width={100}
                height={100}
                className="size-32 object-contain"
              />
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={getNavHref(item.section)}
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
            {session ? (
              // User is logged in - show dashboard button
              <Button
                variant={isScrolled ? 'default' : 'secondary'}
                size="sm"
                className={cn(
                  'hidden sm:inline-flex transition-all duration-300',
                  !isScrolled && 'bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm'
                )}
                onClick={() => (window.location.href = getDashboardUrl())}
              >
                Ir al Dashboard
              </Button>
            ) : (
              // No session - show login button
              <Button
                variant={isScrolled ? 'outline' : 'secondary'}
                size="sm"
                className={cn(
                  'hidden sm:inline-flex transition-all duration-300',
                  !isScrolled && 'bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm'
                )}
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Iniciar sesión
              </Button>
            )}

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
              <SheetContent
                side="right"
                className="w-80 p-0 border-l border-gray-200 bg-gradient-to-b from-white via-gray-300 to-gray-200"
              >
                {/* Header with Logo */}
                <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/acp-logo-transparent.webp"
                        alt="ACP Logo"
                        width={60}
                        height={60}
                        className="size-12 object-contain"
                      />
                      <div>
                        <h2 className="text-gray-900 font-bold text-lg tracking-tight">ACP</h2>
                        <p className="text-gray-500 text-xs">Powerlifting Córdoba</p>
                      </div>
                    </div>
                    {/* <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                      >
                        <XIcon className="h-5 w-5" />
                      </Button>
                    </SheetClose> */}
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="flex flex-col px-4 py-6">
                  <nav className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.name}
                          href={getNavHref(item.section)}
                          className="group flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 active:scale-[0.98]"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="flex-1 font-medium text-base">{item.name}</span>
                          <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200" />
                        </a>
                      );
                    })}
                  </nav>
                </div>

                {/* Divider */}
                <div className="px-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                </div>

                {/* Action Button */}
                <div className="px-6 py-6">
                  {session ? (
                    <Button
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
                      onClick={() => (window.location.href = getDashboardUrl())}
                    >
                      Ir al Dashboard
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
                      onClick={() => (window.location.href = getLoginUrl())}
                    >
                      Iniciar sesión
                    </Button>
                  )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-100">
                  <p className="text-center text-gray-400 text-xs">
                    © 2026 Asociación Cordobesa de Powerlifting
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}