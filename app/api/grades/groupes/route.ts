import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";

/**
 * Get available groupes for a given cursus and filiere from existing templates
 */
export async function GET(request: Request) {
    try {
        const isAuthorized = await requestAuthCheck();
        if (!isAuthorized) return;

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
