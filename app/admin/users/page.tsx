import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { isAdmin } from "@lib/user/checkAdmin";
import AdminUsersPage from "@/app/components/pages/AdminUsersPage";

export const metadata: Metadata = {
    title: "Utilisateurs - Admin - MyEFREI Grades",
    description: "Gérer les utilisateurs de la plateforme",
};

export default async function AdminUsers() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/");
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
        redirect("/grades");
    }

    return <AdminUsersPage />;
}
