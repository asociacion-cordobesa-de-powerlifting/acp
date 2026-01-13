"use client"

import { ChevronRight, ChevronsUpDown, LogOut, ClipboardList, User2, Users, HouseIcon, Trophy, Home } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarSeparator,
} from "@acme/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@acme/ui/collapsible"
import Image from "next/image"
import { authClient } from "~/auth/client"
import { useRouter } from "next/navigation"

interface NavItem {
    title: string
    url: string
    icon: React.FC<any>,
    isActive?: boolean
    disabled?: boolean
    items?: Omit<NavItem, 'icon' | 'items'>[]
}

// Menu items for Team Dashboard
const items: NavItem[] = [
    {
        title: "General",
        url: "/team/dashboard",
        icon: HouseIcon,
    },
    {
        title: "Atletas",
        url: "/team/dashboard/athletes",
        icon: Users,
    },
    {
        title: "Torneos",
        url: "/team/dashboard/tournaments",
        icon: Trophy,
    },
    {
        title: "Inscripciones",
        url: "/team/dashboard/registrations",
        icon: ClipboardList,
    },
    {
        title: "Coaches",
        url: "/team/dashboard/coaches",
        icon: User2,
    },
]

export function TeamSidebar({
    user,
}: {
    user: { name?: string | null; email?: string | null; role?: string | null }
}) {
    const router = useRouter()
    const signOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/team/login");
                },
            },
        })
    }

    return (
        <Sidebar collapsible="icon" variant="inset" className="transition-all duration-300">
            <SidebarHeader>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-2 cursor-default hover:bg-sidebar hover:text-sidebar-foreground active:bg-sidebar active:text-sidebar-foreground"
                >
                    <div className="relative">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-full text-sidebar-primary-foreground">
                            <Image src={'/acp.webp'} alt={"Asociación Cordobesa de Powerlifting Logo"} height={30} width={30} className="rounded-full" />
                        </div>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="font-semibold truncate">
                            ACP
                        </span>
                        <span className="truncate text-xs">
                            Panel de Equipo
                        </span>
                    </div>
                </SidebarMenuButton>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Gestión</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip={item.title} disabled={item.disabled}>
                                            {item.disabled ? (
                                                <div className='text-muted'>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </div>
                                            ) : (
                                                <a href={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </a>
                                            )
                                            }

                                        </SidebarMenuButton>
                                        {item.items?.length && (
                                            <>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                                                        <ChevronRight />
                                                        <span className="sr-only">Toggle</span>
                                                    </SidebarMenuAction>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild>
                                                                    <a href={subItem.url}>
                                                                        <span>{subItem.title}</span>
                                                                    </a>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </>
                                        )}
                                    </SidebarMenuItem>
                                </Collapsible>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarGroup>
                {/* <SidebarGroupLabel>Información</SidebarGroupLabel> */}
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size={"sm"}>
                                <a href="/">
                                    <Home />
                                    <span>Inicio</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="transition-all duration-200">
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg text-black">
                                        <User2 className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user.name}</span>
                                        <span className="truncate text-xs">{user.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem onClick={() => signOut()} className="transition-all duration-200">
                                    <LogOut />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
