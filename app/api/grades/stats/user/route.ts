import {NextResponse} from "next/server";
import clientPromise from "@lib/mongodb";
import {ObjectId} from "mongodb";
import {UserSemesterDB} from "@lib/grades/types";
import {requestAuthCheck} from "@lib/api/request_check";
import {getStudentRankings} from "@lib/stats/user_ranking";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";

export async function GET(request: Request) {
    return instrumentApiRoute('grades/stats/user/GET', async () => {
        try {
            const session = await requestAuthCheck();
            if (!session || !session?.user) return;

            const { searchParams } = new URL(request.url);
            const semesterId = searchParams.get('semesterId');

            if (!semesterId) {
                return NextResponse.json(
                    { error: "semesterId requis" },
                    { status: 400 }
                );
            }

            const client = await clientPromise;
            const db = client.db();

            // Get user
            const user = await db.collection('users').findOne({ email: session.user.email });
            if (!user) {
                return NextResponse.json(
                    { error: "Utilisateur non trouvé" },
                    { status: 404 }
                );
            }

            // Get user's semester
            const userSemester = await db.collection<UserSemesterDB>('userSemesters')
                .findOne({
                    _id: new ObjectId(semesterId),
                    userId: user._id
                });

            if (!userSemester) {
                return NextResponse.json(
                    { error: "Semestre non trouvé" },
                    { status: 404 }
                );
            }

            const rankings: StudentRankingsData = {} as StudentRankingsData;

            // 1. GROUP rankings - Top 10 from same branch (or groupe if no branch)
            const hasBranch = userSemester.branch && userSemester.branch.trim() !== '';
            const effectiveBranch = hasBranch ? userSemester.branch : userSemester.groupe;

            if (hasBranch || userSemester.groupe) {
                rankings.group = await getStudentRankings(
                    db,
                    {
                        academicYear: userSemester.academicYear,
                        semester: userSemester.semester,
                        groupe: userSemester.groupe,
                        $or: [
                            { branch: effectiveBranch },
                            {
                                branch: { $in: [null, ""] },
                                groupe: effectiveBranch
                            }
                        ]
                    },
                    10
                );
            } else {
                rankings.group = [];
            }

            // 2. SPE rankings - Top 10 from same groupe
            rankings.spe = await getStudentRankings(
                db,
                {
                    academicYear: userSemester.academicYear,
                    semester: userSemester.semester,
                    groupe: userSemester.groupe
                },
                10
            );

            // 3. FILIERE rankings - Top 10 from same filiere
            rankings.filiere = await getStudentRankings(
                db,
                {
                    academicYear: userSemester.academicYear,
                    semester: userSemester.semester,
                    filiere: userSemester.filiere
                },
                10
            );

            // 4. CURSUS rankings - Top 10 from same cursus
            rankings.cursus = await getStudentRankings(
                db,
                {
                    academicYear: userSemester.academicYear,
                    semester: userSemester.semester,
                    cursus: userSemester.cursus
                },
                10
            );

            return NextResponse.json({
                success: true,
                rankings
            });

        } catch (error) {
            console.error("Error getting student rankings:", error);
            if (error instanceof Error) noticeError(error, { route: 'grades/stats/user/GET' });
            return NextResponse.json(
                { error: "Erreur serveur" },
                { status: 500 }
            );
        }
    });
}