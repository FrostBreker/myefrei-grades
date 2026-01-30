import {getServerSession, Session} from "next-auth";
import {authOptions} from "@api/auth/[...nextauth]/route";
import {NextResponse} from "next/server";
import {isAdmin} from "@lib/user/checkAdmin";

export async function requestAdminCheck(): Promise<Session | null> {
    // Verifier la session utilisateur
    const session = await requestAuthCheck();
    if (!session) {
        return null;
    }

    // Vérifier que l'utilisateur est admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
        NextResponse.json({error: "Accès refusé"}, {status: 403});
        return null;
    }

    return session;
}

export async function requestAuthCheck(): Promise<Session | null> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        NextResponse.json({error: "Non autorisé"}, {status: 401});
        return null;
    }
    return session;
}