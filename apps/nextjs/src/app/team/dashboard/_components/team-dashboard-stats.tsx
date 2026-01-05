"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useTRPC } from "~/trpc/react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@acme/ui/card"
import { Users, ClipboardList, Clock, CheckCircle2, XCircle, Trophy } from "lucide-react"
import { Button } from "@acme/ui/button"
import Link from "next/link"
import { Badge } from "@acme/ui/badge"

export function TeamDashboardStats() {
    const trpc = useTRPC()
    const { data: stats } = useSuspenseQuery(trpc.registrations.teamStats.queryOptions())

    const statCards = [
        {
            title: "Atletas",
            value: stats.totalAthletes,
            description: "Atletas registrados",
            icon: Users,
            link: "/team/dashboard/athletes",
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "Inscripciones",
            value: stats.totalRegistrations,
            description: "Total de inscripciones",
            icon: ClipboardList,
            link: "/team/dashboard/registrations",
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/20",
        },
    ]

    const registrationStats = [
        {
            label: "Pendientes",
            value: stats.pendingRegistrations,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
        },
        {
            label: "Aprobadas",
            value: stats.approvedRegistrations,
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
            label: "Rechazadas",
            value: stats.rejectedRegistrations,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-100 dark:bg-red-900/20",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Main Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Link key={stat.title} href={stat.link}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {/* Registration Status Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Inscripciones</CardTitle>
                    <CardDescription>
                        Desglose de tus inscripciones por estado
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {registrationStats.map((stat) => {
                            const Icon = stat.icon
                            const percentage = stats.totalRegistrations > 0
                                ? Math.round((stat.value / stats.totalRegistrations) * 100)
                                : 0
                            return (
                                <div key={stat.label} className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{stat.label}</p>
                                            <Badge variant="secondary">{percentage}%</Badge>
                                        </div>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Accesos Rápidos</CardTitle>
                    <CardDescription>
                        Accede rápidamente a las secciones principales
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
                            <Link href="/team/dashboard/tournaments">
                                <Trophy className="h-5 w-5 mb-2" />
                                <span className="font-semibold">Torneos</span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    Ver torneos disponibles
                                </span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
                            <Link href="/team/dashboard/registrations">
                                <ClipboardList className="h-5 w-5 mb-2" />
                                <span className="font-semibold">Inscripciones</span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    Ver y gestionar inscripciones
                                </span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
                            <Link href="/team/dashboard/athletes">
                                <Users className="h-5 w-5 mb-2" />
                                <span className="font-semibold">Atletas</span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    Gestionar atletas
                                </span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

