import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { isAdmin } from "@lib/user/checkAdmin";
import YearTemplatesListPage from "../../components/pages/YearTemplatesListPage";

export const metadata: Metadata = {
    title: "Templates d'Année - Admin - MyEFREI Grades",
    description: "Gérer les templates d'année académique",
};

export default async function AdminYearTemplates() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/");
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
        redirect("/grades");
    }

    return <YearTemplatesListPage />;
}
