import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@acme/ui/sidebar";
import { TeamSidebar } from "./_components/team-sidebar";
import { Separator } from "@acme/ui/separator";

export default async function TeamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.user.role !== "user") {
        redirect("/team/login");
    }

    return (
        <SidebarProvider>
            <TeamSidebar user={session.user} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                    </div>
                </header>
                <main className="container">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
