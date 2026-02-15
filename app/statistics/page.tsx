import {getServerSession} from "next-auth";
import {authOptions} from "@api/auth/[...nextauth]/route";
import {redirect} from "next/navigation";
import {Metadata} from "next";
import StatisticsPage from "@/app/components/pages/StatisticsPage";
import clientPromise from "@lib/mongodb";
import {checkIfProfileComplete} from "@lib/user/checkIfProfileComplete";
import {checkIfEmailVerified} from "@lib/user/checkIfEmailVerified";
import {createLoader, parseAsString} from "nuqs/server";
import {UserDB} from "@lib/user/types";

// Cache for search params to avoid re-parsing on every request
const searchParamsCache = {
    semesterId: parseAsString.withDefault("")
}

// Create a loader for search params with caching
const loadSearchParams = createLoader(searchParamsCache)

// Metadata for the page
export const metadata: Metadata = {
    title: "Statistiques - MyEFREI Grades",
    description: "Compare tes résultats avec les autres étudiants",
};

// Main page component
export default async function Page({searchParams}: {searchParams: Record<string, string>}) {
    const paramsPromise: {
        semesterId: string
    } = loadSearchParams(await searchParams); // /!\ Even if IDE says we don't need to await, we do, because we want to ensure the cache is used correctly and we have the parsed params ready for the rest of the code.

    // TODO: ----------------------------------------------- NEED REFACTOR ----------------------------------------------- (Statistics page)
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/");
    }

    // Get user from database
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection<UserDB>('users').findOne({email: session.user.email});

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
    // TODO: ----------------------------------------------- END REFACTOR ----------------------------------------------- (Statistics page)

    return (
        <StatisticsPage
            semesterId={paramsPromise.semesterId}
            user={user}
        />
    );
}
