import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import SettingsPage from "@/app/components/pages/SettingsPage";
import clientPromise from "@lib/mongodb";

export const metadata: Metadata = {
    title: "Paramètres - MyEFREI Grades",
    description: "Gère tes préférences et ton compte",
};

export default async function Settings() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/");
    }

    // Get user from database
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
        redirect("/");
    }

    // Check if user has completed onboarding (has personal info)
    if (!user.firstName || !user.lastName || !user.studentNumber) {
        redirect("/onboarding");
    }

    return <SettingsPage userEmail={session.user.email} />;
}
