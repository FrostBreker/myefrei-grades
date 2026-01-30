import { NextResponse } from "next/server";
import { getYearTemplateById } from "@lib/grades/yearTemplateService";
import { syncUserSemestersWithYearTemplate } from "@lib/grades/semesterService";
import {requestAdminCheck} from "@lib/api/request_check";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST - Sync all users who use this template
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

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
