import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { isAdmin } from "@lib/user/checkAdmin";
import { getYearTemplateById } from "@lib/grades/yearTemplateService";
import { syncUserSemestersWithYearTemplate } from "@lib/grades/semesterService";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST - Sync all users who use this template
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        // Check admin
        const userIsAdmin = await isAdmin();
        if (!userIsAdmin) {
            return NextResponse.json(
                { error: "Accès réservé aux administrateurs" },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Verify template exists
        const template = await getYearTemplateById(id);
        if (!template) {
            return NextResponse.json(
                { error: "Template non trouvé" },
                { status: 404 }
            );
        }

        // Sync all users with this template
        const updatedCount = await syncUserSemestersWithYearTemplate(id);

        return NextResponse.json({
            success: true,
            updatedCount,
            message: `${updatedCount} semestre(s) utilisateur mis à jour`
        });
    } catch (error) {
        console.error("Error syncing users:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
