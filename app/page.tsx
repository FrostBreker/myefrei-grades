import {getServerSession, Session} from "next-auth";
import {getUserBySession, User} from "@lib/user/getUserBySession";
import {NextRequest} from "next/server";
import {authOptions} from "@api/auth/[...nextauth]/route";
import HomePage from "@components/pages/HomePage";

export default async function Home(request: NextRequest) {
    // Fetch user data server-side if session exists
    let initialUserData: User | null = null;
    const session: Session | null = await getServerSession(authOptions);
    if (session) {
        initialUserData = await getUserBySession(session, request);
    }
    return <HomePage initialUserData={initialUserData} />;
}
