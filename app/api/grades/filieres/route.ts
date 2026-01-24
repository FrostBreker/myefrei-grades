import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "@lib/mongodb";

/**
 * Get available filieres for a given cursus from existing templates
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

        if (!cursus) {
            return NextResponse.json(
                { error: "Cursus requis" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get distinct filieres for this cursus
        const filieres = await db.collection('academicYearTemplates')
            .distinct('filiere', { cursus });

        return NextResponse.json({
            success: true,
            filieres: filieres.sort()
        });
    } catch (error) {
        console.error("Error getting filieres:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
