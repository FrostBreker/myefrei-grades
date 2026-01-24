import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { isAdmin } from "@lib/user/checkAdmin";
import EditYearTemplatePage from "../../../../components/pages/EditYearTemplatePage";

export const metadata: Metadata = {
    title: "Modifier un Template - Admin - MyEFREI Grades",
    description: "Modifier un template d'année",
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminEditYearTemplate({ params }: PageProps) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/");
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
        redirect("/grades");
    }

    const { id } = await params;

    return <EditYearTemplatePage templateId={id} />;
}
