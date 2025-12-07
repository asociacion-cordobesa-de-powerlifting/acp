import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@acme/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { Separator } from "@acme/ui/separator";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
        redirect("/admin/login");
    }

    return (
        <SidebarProvider>
            <AppSidebar user={session.user} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Mis clientes
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Ventas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
                    </div>
                </header>
                <main className="container">
                    {children}
                </main>
                {/* <main className="w-full">
                    <header className="flex h-16 items-center border-b bg-background px-6">
                        <SidebarTrigger />
                        <div className="ml-4 flex flex-1 items-center justify-between">
                            <h1 className="text-xl font-bold">Panel de Administrador</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    {session.user.name}
                                </span>
                            </div>
                        </div>
                    </header>
                    <div className="p-6 bg-muted/10 min-h-[calc(100vh-4rem)]">
                        {children}
                    </div>
                </main> */}
            </SidebarInset>
        </SidebarProvider>
    );
}
