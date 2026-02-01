import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";
import { instrumentApiRoute, noticeError, recordCustomEvent } from "@lib/newrelic";

export async function DELETE() {
    return instrumentApiRoute('user/delete/DELETE', async () => {
        try {
            const session = await requestAuthCheck();
            if (!session || !session?.user) return;

            const client = await clientPromise;
            const db = client.db();

            // Get user to find their ID
            const user = await db.collection('users').findOne({ email: session.user.email });
            if (!user) {
                return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
            }

            const userId = user._id.toString();

            // Delete all user data
            // 1. Delete user's semesters
            await db.collection('userSemesters').deleteMany({ userEmail: session.user.email });

            // 2. Delete user's academic profile
            await db.collection('academicProfiles').deleteOne({ userId: userId });

            // 3. Delete user account
            await db.collection('users').deleteOne({ email: session.user.email });

            // Record custom event for account deletion tracking
            recordCustomEvent('AccountDeletion', { userId });

            return NextResponse.json({ success: true, message: "Compte supprimé avec succès" });
        } catch (error) {
            console.error("Error deleting account:", error);
            if (error instanceof Error) noticeError(error, { route: 'user/delete/DELETE' });
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }
    });
}
