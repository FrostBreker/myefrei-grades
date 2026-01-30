import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";

/**
 * Get available cursus from existing year templates
 */
export async function GET() {
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
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
