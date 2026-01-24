import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "@lib/mongodb";

/**
 * Get available cursus from existing year templates
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get distinct cursus from year templates
        const cursus = await db.collection('academicYearTemplates')
            .distinct('cursus');

        return NextResponse.json({
            success: true,
            cursus: cursus.sort()
        });
    } catch (error) {
        console.error("Error getting cursus:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
