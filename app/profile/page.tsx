import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ProfilePage from "@/app/components/pages/ProfilePage";
import { getAcademicProfile } from "@lib/grades/profileService";
import clientPromise from "@lib/mongodb";
import {checkIfProfileComplete} from "@lib/user/checkIfProfileComplete";
import {checkIfEmailVerified} from "@lib/user/checkIfEmailVerified";

export const metadata: Metadata = {
    title: "Mon Profil - MyEFREI Grades",
    description: "Consulte et gère ton profil étudiant",
};

export default async function Profile() {
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

    // Get academic profile
    const academicProfile = await getAcademicProfile(user._id.toString());

    // Prepare user profile data
    const userProfile = {
        firstName: user.firstName,
        lastName: user.lastName,
        studentNumber: user.studentNumber,
        email: user.email,
        image: user.image || session.user.image || "",
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    };

    return (
        <ProfilePage
            initialProfile={userProfile}
            initialAcademicProfile={academicProfile}
        />
    );
}
