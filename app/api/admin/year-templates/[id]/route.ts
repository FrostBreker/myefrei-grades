import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { getYearTemplateById } from "@lib/grades/yearTemplateService";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET - Get a single year template by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

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
