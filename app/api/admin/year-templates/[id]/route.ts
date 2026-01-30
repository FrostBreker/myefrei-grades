import { NextResponse } from "next/server";
import { getYearTemplateById } from "@lib/grades/yearTemplateService";
import {requestAuthCheck} from "@lib/api/request_check";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET - Get a single year template by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const isAuthorized = await requestAuthCheck();
        if (!isAuthorized) return;

        const { id } = await params;

        const template = await getYearTemplateById(id);

        if (!template) {
            return NextResponse.json(
                { error: "Template non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            template
        });
    } catch (error) {
        console.error("Error getting year template:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
