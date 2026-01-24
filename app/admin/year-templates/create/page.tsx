import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { isAdmin } from "@lib/user/checkAdmin";
import CreateYearTemplatePage from "../../../components/pages/CreateYearTemplatePage";

export const metadata: Metadata = {
    title: "Créer un Template d'Année - Admin - MyEFREI Grades",
    description: "Créer un nouveau template d'année avec S1 et/ou S2",
};

export default async function AdminCreateYearTemplate() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/");
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
        redirect("/grades");
    }

    return <CreateYearTemplatePage />;
}
