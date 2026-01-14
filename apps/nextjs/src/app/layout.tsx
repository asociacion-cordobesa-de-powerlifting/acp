import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display, Roboto_Mono } from "next/font/google";

import { cn } from "@acme/ui";
// import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import "~/app/styles.css";

const siteUrl = process.env.BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    template: '%s | ACP',
    default: 'ACP - Asociación Cordobesa de Powerlifting',
  },
  description: 'Plataforma oficial de gestión de torneos de powerlifting de Córdoba. Inscripciones, nóminas preliminares y resultados de competencias.',
  generator: 'Next.js',
  applicationName: 'ACP - Asociación Cordobesa de Powerlifting',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'powerlifting',
    'córdoba',
    'argentina',
    'torneos',
    'competencias',
    'fuerza',
    'ACP',
    'FALPO',
    'IPF',
    'sentadilla',
    'press banca',
    'peso muerto',
  ],
  authors: [{ name: 'Asociación Cordobesa de Powerlifting' }],
  creator: 'ACP',
  publisher: 'Asociación Cordobesa de Powerlifting',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ACP - Asociación Cordobesa de Powerlifting',
    description: 'Plataforma oficial de gestión de torneos de powerlifting de Córdoba. Inscripciones abiertas para atletas y equipos.',
    url: siteUrl,
    siteName: 'ACP',
    locale: 'es_AR',
    type: 'website',
    // images: [
    //   {
    //     url: '/og-image.jpg',
    //     width: 630,
    //     height: 630,
    //     alt: 'ACP - Asociación Cordobesa de Powerlifting',
    //   },
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ACP - Asociación Cordobesa de Powerlifting',
    description: 'Plataforma oficial de gestión de torneos de powerlifting de Córdoba.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  category: 'sports',
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="ACP - Asociación Cordobesa de Powerlifting" />
      </head>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          montserrat.variable,
          playfairDisplay.variable,
          robotoMono.variable,
        )}
      >
        {/* <ThemeProvider> */}
        <TRPCReactProvider>
          <NuqsAdapter>
            {props.children}
          </NuqsAdapter>
        </TRPCReactProvider>
        {/* <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div> */}
        <Toaster />
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
