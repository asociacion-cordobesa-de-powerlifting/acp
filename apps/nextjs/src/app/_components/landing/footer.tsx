import React from 'react'
import Image from 'next/image'

const federations = [
  {
    name: 'ACP',
    fullName: 'Asociación Cordobesa de Powerlifting',
    logo: '/acp-logo.webp',
  },
  {
    name: 'FALPO',
    fullName: 'Federación Argentina de Levantamientos de Potencia',
    logo: '/falpo.webp',
    url: 'https://www.powerlifting.com.ar',
  },
  {
    name: 'FESUPO',
    fullName: 'Federación Sudamericana de Powerlifting',
    logo: '/fesupo.webp',
    url: 'https://www.powerlifting-fesupo.com/',
  },
  {
    name: 'IPF',
    fullName: 'International Powerlifting Federation',
    logo: '/ipf.webp',
    url: 'https://www.powerlifting.sport',
  },
]

export const Footer = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 mt-8">
      <div className="max-w-6xl mx-auto">
        {/* Federations Logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-8 pb-8 border-b border-foreground/10">
          {federations.map((fed) => (
            <div key={fed.name} className="flex flex-col items-center gap-2">
              {fed.url ? (
                <a
                  href={fed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:opacity-80"
                >
                  <Image
                    src={fed.logo}
                    alt={`${fed.fullName} logo`}
                    width={80}
                    height={80}
                    className="h-16 w-auto object-contain"
                  />
                </a>
              ) : (
                <Image
                  src={fed.logo}
                  alt={`${fed.fullName} logo`}
                  width={80}
                  height={80}
                  className="h-16 w-auto object-contain"
                />
              )}
              <span className="text-xs text-muted-foreground text-center">
                {fed.name}
              </span>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center space-y-2">
          <p className="font-semibold text-foreground">
            © {new Date().getFullYear()} Asociación Cordobesa de Powerlifting
          </p>
          <p className="text-sm text-muted-foreground">
            Plataforma de gestión de torneos de powerlifting
          </p>
        </div>
      </div>
    </footer>
  )
}
