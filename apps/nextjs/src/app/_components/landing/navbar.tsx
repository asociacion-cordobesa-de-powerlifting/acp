'use client';

import { MenuIcon } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { Sheet, SheetContent, SheetTrigger } from '@acme/ui/sheet';
import { Button } from '@acme/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@acme/ui';

const navigation = [
  { name: 'Inicio', section: 'inicio' },
  { name: 'Torneos', section: 'torneos' },
  { name: 'Equipos', section: 'equipos' },
  { name: 'Cómo funciona', section: 'como-funciona' },
  { name: 'Contacto', section: 'contacto' },
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
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-6 mt-8">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={getNavHref(item.section)}
                      className="text-sm font-medium text-foreground hover:text-primary transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                  {session ? (
                    <Button
                      className="w-full"
                      onClick={() => (window.location.href = getDashboardUrl())}
                    >
                      Ir al Dashboard
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => (window.location.href = getLoginUrl())}
                    >
                      Iniciar sesión
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}