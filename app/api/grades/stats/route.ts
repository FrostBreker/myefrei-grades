import {NextResponse} from "next/server";
import clientPromise from "@lib/mongodb";
import { ObjectId} from "mongodb";
import {UserSemesterDB} from "@lib/grades/types";
import {requestAuthCheck} from "@lib/api/request_check";
import {calculateBranchRankingsForGroup, calculateFiliereRankings, calculateGroupeRankings, calculateGroupeRankingsForSpe, calculateLevelStats, calculateUEAverage} from "@lib/stats/group_rankings";

export async function GET(request: Request) {
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

        // Calculate user's averages
        const userGlobalAvg = userSemester.average;
        const userUEAverages = userSemester.ues.map(ue => ({
            id: ue.id,
            code: ue.code,
            name: ue.name,
            average: ue.average ?? calculateUEAverage(ue.modules),
            modules: ue.modules.map(m => ({
                id: m.id,
                code: m.code,
                name: m.name,
                average: m.average ?? null
            }))
        }));

        const stats: StatsData = {} as StatsData;

        // 1. GROUP stats (based on branch field)
        // TODO: Come back to this - some users don't have branch because they are on PLUS spe
        // which doesn't have groups (they are alone). For now, we show no stats if branch is null/empty.
        // Later we might want to handle PLUS spe differently.
        const hasBranch = userSemester.branch && userSemester.branch.trim() !== '';

        // For users without branch, use groupe as effective branch
        const effectiveBranch = hasBranch ? userSemester.branch : userSemester.groupe;

        if (hasBranch || userSemester.groupe) {
            // Find all semesters with the same effective branch
            const branchSemesters = await db.collection<UserSemesterDB>('userSemesters')
                .find({
                    academicYear: userSemester.academicYear,
                    semester: userSemester.semester,
                    groupe: userSemester.groupe,
                    $or: [
                        { branch: effectiveBranch },
                        {
                            $and: [
                                {
                                    $or: [
                                        { branch: { $exists: false } },
                                        { branch: null as never },
                                        { branch: "" }
                                    ]
                                },
                                { groupe: effectiveBranch }
                            ]
                        }
                    ]
                })
                .toArray();

            stats.group = {
                ...calculateLevelStats(
                    branchSemesters,
                    effectiveBranch,
                    userGlobalAvg,
                    userUEAverages,
                    false, // No normalization for branch level
                    true   // Include modules
                ),
                ranking: await calculateBranchRankingsForGroup(
                    db,
                    userSemester.academicYear,
                    userSemester.semester,
                    userSemester.groupe // Only branches within this groupe
                )
            };
        } else {
            // No branch and no groupe - return empty stats
            stats.group = {
                name: "N/A",
                totalUsers: 0,
                averages: {
                    global: {
                        average: null,
                        rank: null,
                        totalWithGrades: 0,
                        min: null,
                        max: null,
                        median: null
                    },
                    byUE: []
                },
                ranking: []
            };
        }

        // 2. SPE stats (based on groupe field)
        const groupeSemesters = await db.collection<UserSemesterDB>('userSemesters')
            .find({
                academicYear: userSemester.academicYear,
                semester: userSemester.semester,
                groupe: userSemester.groupe
            })
            .toArray();

        stats.spe = {
            ...calculateLevelStats(
                groupeSemesters,
                userSemester.groupe,
                userGlobalAvg,
                userUEAverages,
                false, // No normalization for groupe level
                true   // Include modules
            ),
            // SPE rankings show ALL groupes/branches across the filiere
            // If branch exists, it's ranked by branch name; if not, by groupe name
            ranking: await calculateGroupeRankingsForSpe(
                db,
                userSemester.academicYear,
                userSemester.semester,
                userSemester.filiere // Use filiere to get ALL groupes (INT1, MARK1, CLASSIQUE, PMP, etc.)
            )
        };

        // 3. FILIERE stats (based on filiere field) - with normalization
        const filiereSemesters = await db.collection<UserSemesterDB>('userSemesters')
            .find({
                academicYear: userSemester.academicYear,
                semester: userSemester.semester,
                filiere: userSemester.filiere
            })
            .toArray();

        stats.filiere = {
            ...calculateLevelStats(
                filiereSemesters,
                userSemester.filiere,
                userGlobalAvg,
                userUEAverages,
                true, // Normalize codes for filiere level
                true  // Include modules
            ),
            ranking: await calculateGroupeRankings(
                db,
                userSemester.academicYear,
                userSemester.semester,
                userSemester.filiere
            )
        };

        // 4. CURSUS stats (based on cursus field) - with normalization, NO MODULES
        const cursusSemesters = await db.collection<UserSemesterDB>('userSemesters')
            .find({
                academicYear: userSemester.academicYear,
                semester: userSemester.semester,
                cursus: userSemester.cursus
            })
            .toArray();

        stats.cursus = {
            ...calculateLevelStats(
                cursusSemesters,
                userSemester.cursus,
                userGlobalAvg,
                userUEAverages,
                true,  // Normalize codes for cursus level
                false  // NO modules for cursus
            ),
            ranking: await calculateFiliereRankings(
                db,
                userSemester.academicYear,
                userSemester.semester,
                userSemester.cursus
            )
        };

        return NextResponse.json({
            success: true,
            stats,
            userAverage: userGlobalAvg
        });

    } catch (error) {
        console.error("Error getting stats:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}