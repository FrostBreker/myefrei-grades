import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import SetupPage from "@/app/components/pages/SetupPage";
import { getAcademicProfile } from "@lib/grades/profileService";
import clientPromise from "@lib/mongodb";
import {checkIfProfileComplete} from "@lib/user/checkIfProfileComplete";
import {checkIfEmailVerified} from "@lib/user/checkIfEmailVerified";

export const metadata: Metadata = {
    title: "Configuration - MyEFREI Grades",
    description: "Configure ton profil académique",
};

export default async function Setup() {
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
    const isProfileComplete = checkIfProfileComplete(user);
    if (!isProfileComplete) {
        redirect("/onboarding");
    }

    // Check if user has verified their EFREI email
    const isEmailVerified = checkIfEmailVerified(user);
    if (!isEmailVerified) {
        redirect("/verify-email");
    }

    // Check if user already has a profile
    const profile = await getAcademicProfile(user._id.toString());

    // If profile exists with paths, redirect to grades
    if (profile && profile.paths.length > 0) {
        redirect("/grades");
    }

    return <SetupPage />;
}
