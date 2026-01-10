import Navbar from './_components/landing/navbar';
import HeroVideo from './_components/landing/hero-video';
import SegmentsSection from './_components/landing/segments-section';
import StepsSection from './_components/landing/steps-section';
import UpcomingTournamentsSection from './_components/landing/upcoming-tournaments-section';
import TeamsSection from './_components/landing/teams-section';
// import AthletesSection from './_components/landing/athletes-section';
import { Footer } from './_components/landing/footer';
import { getSession } from '~/auth/server';

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar session={session} />

      {/* Hero Section with Video */}
      <HeroVideo />

      {/* For Whom Section */}
      <SegmentsSection />

      {/* Upcoming Tournaments Section */}
      <UpcomingTournamentsSection />

      {/* Teams Section */}
      <TeamsSection />

      {/* How It Works Section */}
      <StepsSection />

      {/* Athletes Section */}
      {/* <AthletesSection /> */}

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
