import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "@lib/mongodb";

/**
 * Get available groupes for a given cursus and filiere from existing templates
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const cursus = searchParams.get('cursus');
        const filiere = searchParams.get('filiere');

        if (!cursus || !filiere) {
            return NextResponse.json(
                { error: "Cursus et filière requis" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get distinct groupes for this cursus and filiere
        const groupes = await db.collection('academicYearTemplates')
            .distinct('groupe', { cursus, filiere });

        return NextResponse.json({
            success: true,
            groupes: groupes.sort()
        });
    } catch (error) {
        console.error("Error getting groupes:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
