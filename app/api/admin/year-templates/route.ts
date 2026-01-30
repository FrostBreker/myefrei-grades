import { NextResponse } from "next/server";
import {
    getAllYearTemplates,
    createYearTemplate,
    updateYearTemplate,
    deleteYearTemplate
} from "@lib/grades/yearTemplateService";
import { Cursus, Filiere, Groupe, SemesterData } from "@lib/grades/types";
import {requestAdminCheck, requestAuthCheck} from "@lib/api/request_check";

/**
 * GET - Get all year templates
 */
export async function GET() {
    try {
        const isAuthorized = await requestAuthCheck();
        if (!isAuthorized) return;

        const templates = await getAllYearTemplates();

        return NextResponse.json({
            success: true,
            templates
        });
    } catch (error) {
        console.error("Error getting year templates:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

/**
 * POST - Create new year template (admin only)
 */
export async function POST(request: Request) {
    try {
        const isAuthorized = await requestAuthCheck();
        if (!isAuthorized) return;

        const { cursus, filiere, groupe, academicYear, semesters } = await request.json();

        // Validate required fields
        if (!cursus || !filiere || !groupe || !academicYear || !semesters) {
            return NextResponse.json(
                { error: "Champs requis manquants" },
                { status: 400 }
            );
        }

        // Validate semesters array
        if (!Array.isArray(semesters) || semesters.length === 0) {
            return NextResponse.json(
                { error: "Au moins un semestre est requis" },
                { status: 400 }
            );
        }

        // Create template
        const template = await createYearTemplate(
            cursus as Cursus,
            filiere as Filiere,
            groupe as Groupe,
            academicYear,
            semesters as SemesterData[]
        );

        return NextResponse.json({
            success: true,
            template
        });
    } catch (error: unknown) {
        console.error("Error creating year template:", error);

        if (error instanceof Error) {
            if (error.message.includes("already exists")) {
                return NextResponse.json(
                    { error: "Un template existe déjà pour cette année/filière/groupe" },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update year template (admin only)
 */
export async function PUT(request: Request) {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

        const { templateId, semesters } = await request.json();

        if (!templateId) {
            return NextResponse.json(
                { error: "Template ID requis" },
                { status: 400 }
            );
        }

        const template = await updateYearTemplate(templateId, semesters);

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
        console.error("Error updating year template:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Delete year template (admin only)
 */
export async function DELETE(request: Request) {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

        const { searchParams } = new URL(request.url);
        const templateId = searchParams.get('templateId');

        if (!templateId) {
            return NextResponse.json(
                { error: "Template ID requis" },
                { status: 400 }
            );
        }

        const deleted = await deleteYearTemplate(templateId);

        if (!deleted) {
            return NextResponse.json(
                { error: "Template non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Template supprimé"
        });
    } catch (error) {
        console.error("Error deleting year template:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
