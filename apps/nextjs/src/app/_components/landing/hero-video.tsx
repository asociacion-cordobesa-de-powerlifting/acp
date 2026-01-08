'use client';

import { buttonVariants } from '@acme/ui/button';
import Link from 'next/link';

interface HeroVideoProps {
    /** Path to the video file (relative to public folder) */
    videoSrc?: string;
    /** Fallback image if video fails to load */
    fallbackImage?: string;
    /** Title text */
    title?: string;
    /** Subtitle/description text */
    subtitle?: string;
}

export default function HeroVideo({
    videoSrc = '/hero-video.mp4',
    fallbackImage = '/acp.webp',
    title = 'Asociación Cordobesa de Powerlifting',
    subtitle = 'Gestión centralizada de torneos de powerlifting para equipos y atletas de Córdoba',
}: HeroVideoProps) {
    return (
        <section className="relative h-[80vh] w-full overflow-hidden">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                    poster={fallbackImage}
                >
                    <source src={videoSrc} type="video/mp4" />
                    {/* Fallback for browsers that don't support video */}
                    <img
                        src={fallbackImage}
                        alt="Hero background"
                        className="h-full w-full object-cover"
                    />
                </video>

                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Gradient overlay for extra depth */}
                {/* <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" /> */}
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl text-center">
                    {/* Logo/Badge */}
                    <div className="mb-6 inline-flex items-center justify-center">
                        <span className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm border border-primary/30">
                            🏋️ Federación Oficial
                        </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="block">{title}</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300 sm:text-xl md:text-2xl">
                        {subtitle}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/team/login"
                            className={buttonVariants({
                                size: 'lg',
                                className:
                                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 px-8 py-6 text-lg font-semibold',
                            })}
                        >
                            Ingresar como Equipo
                        </Link>
                        <Link
                            href="#torneos"
                            className={buttonVariants({
                                size: 'lg',
                                variant: 'outline',
                                className:
                                    'px-8 py-6 text-lg',
                            })}
                        >
                            Ver Torneos
                        </Link>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <svg
                            className="h-8 w-8 text-white/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}
