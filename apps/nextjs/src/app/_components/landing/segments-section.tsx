import React from 'react'
import {
  ClipboardListIcon,
  DumbbellIcon,
  UsersIcon,
} from '@acme/ui/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@acme/ui/card';

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
      'Gestiona atletas e inscripciones en tiempo real.',
    icon: UsersIcon,
  },
  {
    title: 'Atletas',
    description:
      'Consulta torneos disponibles, atletas inscriptos e información oficial.',
    icon: DumbbellIcon,
  },
];

const SegmentsSection = () => {
  return (
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
  )
}

export default SegmentsSection
