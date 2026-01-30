import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";

/**
 * Get available academic years from existing year templates
 * Optionally filtered by cursus, filiere, and groupe
 */
export async function GET(request: Request) {
    try {
        const isAuthorized = await requestAuthCheck();
        if (!isAuthorized) return;

        const { searchParams } = new URL(request.url);
        const cursus = searchParams.get('cursus');
        const filiere = searchParams.get('filiere');
        const groupe = searchParams.get('groupe');

        const client = await clientPromise;
        const db = client.db();

        // Build filter based on provided parameters
        const filter: Record<string, string> = {};
        if (cursus) filter.cursus = cursus;
        if (filiere) filter.filiere = filiere;
        if (groupe) filter.groupe = groupe;

        // Get distinct academic years
        const academicYears = await db.collection('academicYearTemplates')
            .distinct('academicYear', filter);

        // Sort years in descending order (most recent first)
        const sortedYears = academicYears.sort((a: string, b: string) => b.localeCompare(a));

        return NextResponse.json({
            success: true,
            academicYears: sortedYears
        });
    } catch (error) {
        console.error("Error getting academic years:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
