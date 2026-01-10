"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@acme/ui/badge"

interface TickerItem {
    id: string
    href: string
    label: string
    badgeLabel: string
    badgeColor: string
}

interface ModalitiesTickerProps {
    items: TickerItem[]
}

export function ModalitiesTicker({ items }: ModalitiesTickerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    // Auto-scroll animation
    useEffect(() => {
        if (isPaused || isDragging) return

        const container = containerRef.current
        if (!container) return

        let animationId: number
        let lastTime = performance.now()

        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastTime
            lastTime = currentTime

            // Speed: pixels per millisecond
            const speed = 0.03
            container.scrollLeft += speed * deltaTime

            // Reset scroll when halfway (for seamless loop)
            const halfScroll = container.scrollWidth / 2
            if (container.scrollLeft >= halfScroll) {
                container.scrollLeft = 0
            }

            animationId = requestAnimationFrame(animate)
        }

        animationId = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(animationId)
    }, [isPaused, isDragging])

    // Mouse drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true)
        setStartX(e.pageX - (containerRef.current?.offsetLeft || 0))
        setScrollLeft(containerRef.current?.scrollLeft || 0)
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
        const x = e.pageX - (containerRef.current?.offsetLeft || 0)
        const walk = (x - startX) * 1.5 // Scroll speed multiplier
        if (containerRef.current) {
            containerRef.current.scrollLeft = scrollLeft - walk
        }
    }, [isDragging, startX, scrollLeft])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false)
        setIsPaused(false)
    }, [])

    // Touch handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true)
        setStartX(e.touches[0]!.pageX - (containerRef.current?.offsetLeft || 0))
        setScrollLeft(containerRef.current?.scrollLeft || 0)
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return
        const x = e.touches[0]!.pageX - (containerRef.current?.offsetLeft || 0)
        const walk = (x - startX) * 1.5
        if (containerRef.current) {
            containerRef.current.scrollLeft = scrollLeft - walk
        }
    }, [isDragging, startX, scrollLeft])

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false)
    }, [])

    // Double the items for seamless loop
    const allItems = [...items, ...items]

    return (
        <div className="relative overflow-hidden">
            {/* Left gradient mask */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
            {/* Right gradient mask */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

            {/* Scrollable container */}
            <div
                ref={containerRef}
                className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setIsPaused(true)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {allItems.map((item, index) => (
                    <Link
                        key={`${item.id}-${index}`}
                        href={item.href}
                        scroll={false}
                        draggable={false}
                        onClick={(e) => {
                            // Prevent click if was dragging
                            if (isDragging) {
                                e.preventDefault()
                            }
                        }}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 mx-2 rounded-full border border-border bg-card hover:bg-muted transition"
                    >
                        <span className="text-sm font-medium whitespace-nowrap">
                            {item.label}
                        </span>
                        <Badge className={`${item.badgeColor} text-white text-xs`}>
                            {item.badgeLabel}
                        </Badge>
                    </Link>
                ))}
            </div>
        </div>
    )
}
