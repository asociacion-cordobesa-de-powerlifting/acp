import { Button, buttonVariants } from '@acme/ui/button';
import { Badge } from '@acme/ui/badge';
import {
  CalendarIcon,
  UsersIcon,
} from '@acme/ui/icons';
import Link from 'next/link';
import Navbar from './_components/landing/navbar';
import SegmentsSection from './_components/landing/segments-section';
import StepsSection from './_components/landing/steps-section';
import UpcomingTournamentsSection from './_components/landing/upcoming-tournaments-section';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@acme/ui/card';
import { Footer } from './_components/landing/footer';

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

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
                <Link href="/admin/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  Entrar como administrador
                </Link>
                <Link href="/team/login" className={buttonVariants({ size: "lg", variant: "outline", className: "hover:bg-primary" })}>
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
      <SegmentsSection />

      {/* How It Works Section */}
      <StepsSection />

      {/* Upcoming Tournaments Section */}
      <UpcomingTournamentsSection />

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
      <Footer />
    </div>
  );
}
