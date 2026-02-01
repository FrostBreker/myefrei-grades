import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import VerifyEmailPage from "@/app/components/pages/VerifyEmailPage";
import clientPromise from "@lib/mongodb";
import { checkIfProfileComplete } from "@lib/user/checkIfProfileComplete";
import { checkIfEmailVerified } from "@lib/user/checkIfEmailVerified";

export const metadata: Metadata = {
    title: "Vérification Email - MyEFREI Grades",
    description: "Vérifie ton adresse email EFREI",
};

export default async function VerifyEmail() {
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

    // Check if user has completed onboarding (has personal info) first
    const isProfileComplete = checkIfProfileComplete(user);
    if (!isProfileComplete) {
        redirect("/onboarding");
    }

    // If already verified, redirect to setup or grades
    const isEmailVerified = checkIfEmailVerified(user);
    if (isEmailVerified) {
        redirect("/setup");
    }

    return <VerifyEmailPage />;
}
