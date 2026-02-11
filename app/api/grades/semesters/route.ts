import {NextResponse} from "next/server";
import {getUserSemesters, getSemesterById, updateSemesterGrades, updateSemesterBranch} from "@lib/grades/semesterService";
import clientPromise from "@lib/mongodb";
import {UE, UserSemester} from "@lib/grades/types";
import {requestAuthCheck} from "@lib/api/request_check";
import {instrumentApiRoute, noticeError, startBackgroundTransaction, addCustomAttributes} from "@lib/newrelic";
import {ObjectId} from "mongodb";
import {ConstructGlobalStatisticsDocument, UpdateLastGlobalStatistics} from "@lib/stats/global_statistics";
import {FetchStatisticsOPTS} from "@lib/types";

export async function GET(request: Request) {
    return instrumentApiRoute('grades/semesters/GET', async () => {
        try {
            // Check authentication
            const session = await requestAuthCheck();
            if (!session || !session?.user) return;

            // Check if requesting a specific semester
            const {searchParams} = new URL(request.url);
            const semesterId = searchParams.get('id');

            // Get user ID
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({email: session.user.email});

            if (!user) {
                return NextResponse.json(
                    {error: "Utilisateur non trouvé"},
                    {status: 404}
                );
            }

            // If specific semester requested
            if (semesterId) {
                const semester = await getSemesterById(semesterId);

                if (!semester) {
                    return NextResponse.json(
                        {error: "Semestre non trouvé"},
                        {status: 404}
                    );
                }

                // Verify user owns this semester
                if (semester.userId !== user._id.toString()) {
                    return NextResponse.json(
                        {error: "Non autorisé"},
                        {status: 403}
                    );
                }

                return NextResponse.json({
                    success: true,
                    semester
                });
            }

            // Get all user semesters
            const semesters = await getUserSemesters(user._id.toString());

            return NextResponse.json({
                success: true,
                semesters
            });
        } catch (error) {
            console.error("Error getting semesters:", error);
            if (error instanceof Error) noticeError(error, {route: 'grades/semesters/GET'});
            return NextResponse.json(
                {error: "Erreur serveur"},
                {status: 500}
            );
        }
    }, {email: undefined});
}

/**
 * PUT - Update grades for a semester
 */
export async function PUT(request: Request) {
    return instrumentApiRoute('grades/semesters/PUT', async () => {
        try {
            const session = await requestAuthCheck();
            if (!session || !session?.user) return;

            const {semesterId, ues, branch} = await request.json();

            if (!semesterId || (!ues && !branch)) {
                return NextResponse.json(
                    {error: "Paramètres manquants"},
                    {status: 400}
                );
            }

            // Get user ID
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({email: session.user.email});

            if (!user) {
                return NextResponse.json(
                    {error: "Utilisateur non trouvé"},
                    {status: 404}
                );
            }

            // Verify user owns this semester
            const existingSemester = await getSemesterById(semesterId);
            if (!existingSemester) {
                return NextResponse.json(
                    {error: "Semestre non trouvé"},
                    {status: 404}
                );
            }

            if (existingSemester.userId !== user._id.toString()) {
                return NextResponse.json(
                    {error: "Non autorisé"},
                    {status: 403}
                );
            }

            // Check if semester is locked
            if (existingSemester.locked) {
                return NextResponse.json(
                    {error: "Ce semestre est verrouillé"},
                    {status: 403}
                );
            }

            if (ues) {
                // Update grades
                const updatedSemester = await updateSemesterGrades(semesterId, ues as UE[]);

                // /!\ WILL NOT BE AWAITED TO NOT DELAY RESPONSE
                /* NOT AWAITED */
                updateSemesterGlobalStats(existingSemester, existingSemester.filiere, false); // Update global stats after grades update for filiere
                updateSemesterGlobalStats(existingSemester, existingSemester.cursus, true); // Update global stats after grades update for cursus
                // END OF NOT AWAITED /!\

                return NextResponse.json({
                    success: true,
                    semester: updatedSemester
                });
            } else if (branch) {
                const updatedSemester = await updateSemesterBranch(semesterId, branch as string);

                return NextResponse.json({
                    success: true,
                    semester: updatedSemester
                });
            }


        } catch (error) {
            console.error("Error updating grades:", error);
            if (error instanceof Error) noticeError(error, {route: 'grades/semesters/PUT'});
            return NextResponse.json(
                {error: "Erreur serveur"},
                {status: 500}
            );
        }
    }, {email: undefined});
}

// Function to update global stats for a semester (e.g., after grades are updated)
async function updateSemesterGlobalStats(semester: UserSemester, name: string, isCursus: boolean) {
    console.log("called updateSemesterGlobalStats with name:", name, "for semester:", semester._id);
    return startBackgroundTransaction(
        `UpdateGlobalStats/${name}`,
        'stats',
        async () => {
            console.log(`Starting global stats update for ${name} - Semester: ${semester._id}`);
            try {
                const fetchOpts: FetchStatisticsOPTS = {
                    name: name,
                    isCursus: isCursus,
                    semester: semester.semester,
                    academicYear: semester.academicYear
                }

                addCustomAttributes({
                    statsName: name,
                    semester: semester.semester,
                    academicYear: semester.academicYear,
                });

                const newRankings = await ConstructGlobalStatisticsDocument(fetchOpts);
                if (!newRankings) {
                    console.error("Failed to construct global statistics document for", name, "semester:", semester._id);
                    noticeError(new Error("Failed to construct global statistics document"), {
                        statsName: name,
                        semester: semester.semester,
                        academicYear: semester.academicYear,
                    });
                    return;
                }

                await UpdateLastGlobalStatistics(fetchOpts, newRankings);
                return;
            } catch (error) {
                console.error("Error updating global statistics for", name, "semester:", semester._id, error);
                if (error instanceof Error) {
                    noticeError(error, {
                        operation: 'updateSemesterGlobalStats',
                        statsName: name,
                        semester: semester.semester,
                        academicYear: semester.academicYear,
                    });
                }
                throw error;
            }
        }
    );
}
