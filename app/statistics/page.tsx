import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import StatisticsPage from "@/app/components/pages/StatisticsPage";
import clientPromise from "@lib/mongodb";
import { getAcademicProfile } from "@lib/grades/profileService";
import { getUserSemesters } from "@lib/grades/semesterService";
import { UserSemester, AcademicProfile } from "@lib/grades/types";

export const metadata: Metadata = {
    title: "Statistiques - MyEFREI Grades",
    description: "Compare tes résultats avec les autres étudiants",
};

export default async function Statistics() {
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
    const semesters = await getUserSemesters(user._id.toString());

    // If no profile or semesters, redirect to setup/grades
    if (!profile || semesters.length === 0) {
        redirect("/grades");
    }

    return (
        <StatisticsPage
            initialProfile={profile}
            initialSemesters={semesters}
        />
    );
}
