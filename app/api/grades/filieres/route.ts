import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";

/**
 * Get available filieres for a given cursus from existing templates
 */
export async function GET(request: Request) {
    try {
        const isAuthorized = await requestAuthCheck();
        if (!isAuthorized) return;

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
