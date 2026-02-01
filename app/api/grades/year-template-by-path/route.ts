import { NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import { AcademicYearTemplateDB } from "@lib/grades/types";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";

export async function GET(request: Request) {
    return instrumentApiRoute('grades/year-template-by-path/GET', async () => {
        try {
            const { searchParams } = new URL(request.url);
            const cursus = searchParams.get("cursus");
            const filiere = searchParams.get("filiere");
            const groupe = searchParams.get("groupe");
            const academicYear = searchParams.get("academicYear");
            if (!cursus || !filiere || !groupe || !academicYear) {
                return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
            }
            const code = `${cursus}_${filiere}_${groupe}_${academicYear}`.toUpperCase();
            const client = await clientPromise;
            const db = client.db();
            const template = await db.collection<AcademicYearTemplateDB>("academicYearTemplates").findOne({ code });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, template });
        } catch (error) {
            if (error instanceof Error) noticeError(error, { route: 'grades/year-template-by-path/GET' });
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }
    });
}
