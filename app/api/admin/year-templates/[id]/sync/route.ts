import {NextResponse} from "next/server";
import {getYearTemplateById} from "@lib/grades/yearTemplateService";
import {getSemesterById, syncUserSemestersWithYearTemplate} from "@lib/grades/semesterService";
import {requestAdminCheck} from "@lib/api/request_check";
import {instrumentApiRoute, noticeError, recordCustomEvent} from "@lib/newrelic";
import {updateSemesterGlobalStats} from "@api/grades/semesters/route";
import {UserSemester} from "@lib/grades/types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST - Sync all users who use this template
 */
export async function POST(request: Request, {params}: RouteParams) {
    return instrumentApiRoute('admin/year-templates/[id]/sync/POST', async () => {
        try {
            const isAuthorized = await requestAdminCheck();
            if (!isAuthorized) return;

            const {id} = await params;

            // Verify template exists
            const template = await getYearTemplateById(id);
            if (!template) {
                return NextResponse.json(
                    {error: "Template non trouvé"},
                    {status: 404}
                );
            }

            // Sync all users with this template
            const updatedCount = await syncUserSemestersWithYearTemplate(id);

            for (let i = 0; i < template.semesters.length; i++) {
                const semester = template.semesters[i];
                // Verify user owns this semester
                const existingSemester: UserSemester = {
                    semester: semester.semester,
                    academicYear: template.academicYear,
                    ues: [],
                    filiere: template.filiere,
                    groupe: "",
                    branch: "",
                    _id: "",
                    average: 0,
                    cursus: template.cursus,
                    templateId: template._id,
                    templateVersion: template.version,
                    name: template.name,
                    code: template.code,
                    createdAt: template.createdAt,
                    userId: "",
                    locked: false,
                    updatedAt: template.updatedAt,
                    ectsObtained: 0,
                    totalECTS: 0,
                    userEmail: ""
                }
                // /!\ WILL NOT BE AWAITED TO NOT DELAY RESPONSE
                /* NOT AWAITED */
                updateSemesterGlobalStats(existingSemester, existingSemester.filiere, false); // Update global stats after grades update for filiere
                updateSemesterGlobalStats(existingSemester, existingSemester.cursus, true); // Update global stats after grades update for cursus
                // END OF NOT AWAITED /!\
            }

            // Record sync operation
            recordCustomEvent('TemplateSync', {
                templateId: id,
                updatedCount
            });

            return NextResponse.json({
                success: true,
                updatedCount,
                message: `${updatedCount} semestre(s) utilisateur mis à jour`
            });
        } catch (error) {
            console.error("Error syncing users:", error);
            if (error instanceof Error) noticeError(error, {route: 'admin/year-templates/[id]/sync/POST'});
            return NextResponse.json(
                {error: "Erreur serveur"},
                {status: 500}
            );
        }
    });
}
