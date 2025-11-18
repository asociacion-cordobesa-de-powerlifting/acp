'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@acme/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@acme/ui/card';
import { Badge } from '@acme/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@acme/ui/sheet';
import {
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  DumbbellIcon,
  MapPinIcon,
  MenuIcon,
  UsersIcon,
} from '@acme/ui/icons';
import { ThemeToggle } from '@acme/ui/theme';
import Link from 'next/link';

const navigation = [
  { name: 'Inicio', href: '#inicio' },
  { name: 'Torneos', href: '#torneos' },
  { name: 'Equipos', href: '#equipos' },
  { name: 'Cómo funciona', href: '#como-funciona' },
  { name: 'Contacto', href: '#contacto' },
];

const segments = [
  {
    title: 'Administradores de ACP',
    description:
      'Gestiona torneos, aprueba nóminas y centraliza toda la información de competiciones.',
    icon: ClipboardListIcon,
  },
  {
    title: 'Equipos y entrenadores',
    description:
      'Inscribe atletas, carga openers y revisa inscripciones en tiempo real.',
    icon: UsersIcon,
  },
  {
    title: 'Atletas',
    description:
      'Consulta torneos disponibles, resultados en PDF e información oficial.',
    icon: DumbbellIcon,
  },
];

const steps = [
  {
    number: '1',
    title: 'El administrador crea el torneo',
    description:
      'Se configura la competición, fechas, sedes y parámetros iniciales.',
    icon: CalendarIcon,
  },
  {
    number: '2',
    title: 'Los equipos inscriben atletas',
    description:
      'Los entrenadores cargan la nómina preliminar con sus competidores.',
    icon: UsersIcon,
  },
  {
    number: '3',
    title: 'ACP revisa y publica',
    description:
      'Se validan datos, se aprueban y publican las nóminas oficiales.',
    icon: ClipboardListIcon,
  },
];

const upcomingTournaments = [
  {
    id: 1,
    name: 'Campeonato Provincial 2025',
    location: 'Centro de Convenciones, Córdoba',
    startDate: '15 de Febrero',
    endDate: '16 de Febrero',
    status: 'Preliminar abierta',
    statusColor: 'bg-primary',
  },
  {
    id: 2,
    name: 'Torneo Clasificatorio Nacional',
    location: 'Estadio Municipal, Córdoba',
    startDate: '20 de Marzo',
    endDate: '21 de Marzo',
    status: 'Próximamente',
    statusColor: 'bg-secondary',
  },
  {
    id: 3,
    name: 'Abierto de Powerlifting Junior',
    location: 'Polideportivo Regional',
    startDate: '10 de Abril',
    endDate: '12 de Abril',
    status: 'Próximamente',
    statusColor: 'bg-muted-foreground',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
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
                onClick={() => (window.location.href = '/admin/login')}
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

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                  Gestión centralizada de torneos de powerlifting
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  La ACP utiliza este sistema para organizar torneos de forma
                  eficiente. Los equipos pueden inscribir atletas de manera
                  ordenada, y el administrador controla preliminares y listados
                  oficiales desde una plataforma única.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admin/login" className={buttonVariants({ size: "lg" })}>
                  Entrar como administrador
                </Link>
                <Link href="/team/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  Entrar como equipo
                </Link>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="hidden lg:flex justify-center">
              <Card className="w-full max-w-sm border-primary/20 shadow-lg">
                <CardHeader className="bg-linear-to-r from-primary/5 to-secondary/10 border-b border-border">
                  <CardTitle className="text-primary">
                    Próximo torneo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      Campeonato Provincial 2025
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Centro de Convenciones, Córdoba
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span>15 - 16 de Febrero, 2025</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UsersIcon className="h-4 w-4 text-primary" />
                      <span>24 equipos inscriptos</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4">
                    <Badge className="bg-primary text-primary-foreground">
                      Preliminar abierta
                    </Badge>
                    <Badge variant="outline">Fase: Inscripción</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section
        id="equipos"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Pensado para la comunidad de powerlifting
            </h2>
            <p className="text-lg text-muted-foreground">
              Una plataforma diseñada para todos los actores del ecosistema
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {segments.map((segment, idx) => {
              const Icon = segment.icon;
              return (
                <Card
                  key={idx}
                  className="border-primary/10 hover:shadow-lg transition"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">
                        {segment.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {segment.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Cómo funciona el sistema
            </h2>
            <p className="text-lg text-muted-foreground">
              Un proceso simple y ordenado en tres pasos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  <Card className="border-accent/20 h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <Icon className="h-6 w-6 text-accent" />
                        </div>
                        <div className="text-3xl font-bold text-accent opacity-20">
                          {step.number}
                        </div>
                      </div>
                      <CardTitle className="text-lg">
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <div className="text-3xl text-muted-foreground">→</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments Section */}
      <section
        id="torneos"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Próximos torneos
            </h2>
            <p className="text-muted-foreground">
              Consulta los eventos programados y sus detalles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="border-l-4 border-primary/20 hover:shadow-lg transition overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg leading-tight">
                      {tournament.name}
                    </CardTitle>
                    <Badge
                      className={`${tournament.statusColor} text-primary-foreground text-xs`}
                    >
                      {tournament.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="h-4 w-4 text-primary" />
                    <span>{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClockIcon className="h-4 w-4 text-primary" />
                    <span>
                      {tournament.startDate} - {tournament.endDate}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <a
                      href={`/torneos/${tournament.id}`}
                      className="text-primary hover:text-primary/80 font-medium text-sm"
                    >
                      Ver detalles →
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-muted/40 dark:bg-muted/20 rounded-lg p-8 md:p-12 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Contacto
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Esta es la plataforma oficial de la Asociación Cordobesa de
                  Powerlifting. Para cualquier duda o consulta, no dudes en
                  contactarnos a través de los siguientes canales.
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Email</p>
                    <a
                      href="mailto:powerlifting.cordoba@gmail.com"
                      className="text-primary hover:text-primary/80 transition"
                    >
                      powerlifting.cordoba@gmail.com
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">
                      Redes sociales
                    </p>
                    <div className="flex gap-4">
                      <a
                        href="#"
                        className="text-primary hover:text-primary/80 transition text-sm"
                      >
                        Instagram
                      </a>
                      <a
                        href="#"
                        className="text-primary hover:text-primary/80 transition text-sm"
                      >
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Aviso Legal:</strong> Esta plataforma es propiedad de
                  la Asociación Cordobesa de Powerlifting y está reservada para
                  uso autorizado. Los datos ingresados son confidenciales y se
                  tratan conforme a nuestras políticas de privacidad.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para más información sobre el funcionamiento del sistema,
                  consulta nuestra documentación completa o contacta
                  directamente al equipo administrativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}
