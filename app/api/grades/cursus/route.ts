import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";

/**
 * Get available cursus from existing year templates
 */
export async function GET() {
    return instrumentApiRoute('grades/cursus/GET', async () => {
        try {
            const isAuthorized = await requestAuthCheck();
            if (!isAuthorized) return;

            const client = await clientPromise;
            const db = client.db();

            // Get distinct cursus from year templates
            const cursus = await db.collection('academicYearTemplates')
                .distinct('cursus');

            return NextResponse.json({
                success: true,
                cursus: cursus.sort()
            });
        } catch (error) {
            console.error("Error getting cursus:", error);
            if (error instanceof Error) noticeError(error, { route: 'grades/cursus/GET' });
            return NextResponse.json(
                { error: "Erreur serveur" },
                { status: 500 }
            );
        }
    });
}
