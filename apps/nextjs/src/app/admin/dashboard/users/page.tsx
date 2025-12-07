import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@acme/ui/button";
import { UsersDataTable } from "./_components/data-table";
import { AdminPageLayout } from "../_components/admin-page-layout";


export default function UsersPage() {
    return (
        <AdminPageLayout
            title="Usuarios"
            description="Gestión de usuarios"
            actions={
                <Button asChild>
                    <Link href="/admin/dashboard/users/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Usuario
                    </Link>
                </Button>
            }
        >
            <UsersDataTable />
        </AdminPageLayout>
    );
}
