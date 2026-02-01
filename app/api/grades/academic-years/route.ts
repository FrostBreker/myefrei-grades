import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "@lib/mongodb";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";

/**
 * Get available academic years from existing year templates
 * Optionally filtered by cursus, filiere, and groupe
 */
export async function GET(request: Request) {
    return instrumentApiRoute('grades/academic-years/GET', async () => {
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
            if (error instanceof Error) noticeError(error, { route: 'grades/academic-years/GET' });
            return NextResponse.json(
                { error: "Erreur serveur" },
                { status: 500 }
            );
        }
    });
}