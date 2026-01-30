import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import GradesPage from "@components/pages/GradesPage";
import { getAcademicProfile } from "@lib/grades/profileService";
import { getUserSemesters } from "@lib/grades/semesterService";
import clientPromise from "@lib/mongodb";

export const metadata: Metadata = {
    title: "Mes Notes - MyEFREI Grades",
    description: "Consulte et gère tes notes EFREI facilement",
};

export default async function Grades() {
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

    // Get profile and semesters server-side
    const profile = await getAcademicProfile(user._id.toString());

    // If no profile or no paths, redirect to setup
    if (!profile || profile.paths.length === 0) {
        redirect("/setup");
    }

    const semesters = await getUserSemesters(user._id.toString());

    return (
        <GradesPage
            initialProfile={profile}
            initialSemesters={semesters}
            userEmail={session.user.email}
        />
    );
}
