import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "@lib/mongodb";

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

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

        return NextResponse.json({ success: true, message: "Compte supprimé avec succès" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
