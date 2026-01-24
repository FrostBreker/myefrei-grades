import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "@lib/mongodb";
import { ObjectId } from "mongodb";
import { UserSemesterDB } from "@lib/grades/types";

interface StatsResult {
    groupe: GroupStats;
    filiere: GroupStats;
    cursus: GroupStats;
}

interface GroupStats {
    name: string;
    totalUsers: number;
    averages: {
        global: AverageStats;
        byUE: UEStats[];
    };
}

interface AverageStats {
    average: number | null;
    rank: number | null;
    totalWithGrades: number;
    min: number | null;
    max: number | null;
    median: number | null;
}

interface UEStats {
    ueId: string;
    ueCode: string;
    ueName: string;
    stats: AverageStats;
    modules: ModuleStats[];
}

interface ModuleStats {
    moduleId: string;
    moduleCode: string;
    moduleName: string;
    stats: AverageStats;
}

// Calculate statistics from an array of averages
function calculateStats(averages: (number | null)[], userAverage: number | null): AverageStats {
    const validAverages = averages.filter((a): a is number => a !== null).sort((a, b) => b - a);

    if (validAverages.length === 0) {
        return {
            average: null,
            rank: null,
            totalWithGrades: 0,
            min: null,
            max: null,
            median: null
        };
    }

    const sum = validAverages.reduce((acc, val) => acc + val, 0);
    const avg = Math.round((sum / validAverages.length) * 100) / 100;

    let rank: number | null = null;
    if (userAverage !== null) {
        rank = validAverages.findIndex(a => userAverage >= a) + 1;
        if (rank === 0) rank = validAverages.length;
    }

    const medianIndex = Math.floor(validAverages.length / 2);
    const median = validAverages.length % 2 === 0
        ? (validAverages[medianIndex - 1] + validAverages[medianIndex]) / 2
        : validAverages[medianIndex];

    return {
        average: avg,
        rank,
        totalWithGrades: validAverages.length,
        min: validAverages[validAverages.length - 1],
        max: validAverages[0],
        median: Math.round(median * 100) / 100
    };
}

// Calculate UE average from modules
function calculateUEAverage(modules: { average?: number | null }[]): number | null {
    const validModules = modules.filter(m => m.average !== null && m.average !== undefined);
    if (validModules.length === 0) return null;

    const sum = validModules.reduce((acc, m) => acc + (m.average || 0), 0);
    return Math.round((sum / validModules.length) * 100) / 100;
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

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

        // Get all semesters for the same groupe (most specific)
        const groupeSemesters = await db.collection<UserSemesterDB>('userSemesters')
            .find({
                cursus: userSemester.cursus,
                filiere: userSemester.filiere,
                groupe: userSemester.groupe,
                academicYear: userSemester.academicYear,
                semester: userSemester.semester
            })
            .toArray();

        // Get all semesters for the same filiere
        const filiereSemesters = await db.collection<UserSemesterDB>('userSemesters')
            .find({
                cursus: userSemester.cursus,
                filiere: userSemester.filiere,
                academicYear: userSemester.academicYear,
                semester: userSemester.semester
            })
            .toArray();

        // Get all semesters for the same cursus
        const cursusSemesters = await db.collection<UserSemesterDB>('userSemesters')
            .find({
                cursus: userSemester.cursus,
                academicYear: userSemester.academicYear,
                semester: userSemester.semester
            })
            .toArray();

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

        // Helper function to calculate stats for a group of semesters
        const calculateGroupStats = (semesters: UserSemesterDB[], groupName: string): GroupStats => {
            // Global averages
            const globalAverages = semesters.map(s => s.average);

            // UE stats
            const ueStatsMap = new Map<string, {
                code: string;
                name: string;
                averages: (number | null)[];
                modules: Map<string, { code: string; name: string; averages: (number | null)[] }>
            }>();

            // Collect all UE and module averages
            for (const sem of semesters) {
                for (const ue of sem.ues) {
                    if (!ueStatsMap.has(ue.id)) {
                        ueStatsMap.set(ue.id, {
                            code: ue.code,
                            name: ue.name,
                            averages: [],
                            modules: new Map()
                        });
                    }
                    const ueData = ueStatsMap.get(ue.id)!;
                    const ueAvg = ue.average ?? calculateUEAverage(ue.modules);
                    ueData.averages.push(ueAvg);

                    for (const mod of ue.modules) {
                        if (!ueData.modules.has(mod.id)) {
                            ueData.modules.set(mod.id, {
                                code: mod.code,
                                name: mod.name,
                                averages: []
                            });
                        }
                        ueData.modules.get(mod.id)!.averages.push(mod.average ?? null);
                    }
                }
            }

            // Build UE stats with user's rank
            const byUE: UEStats[] = [];
            for (const [ueId, ueData] of ueStatsMap) {
                const userUE = userUEAverages.find(u => u.id === ueId);
                const userUEAvg = userUE?.average ?? null;

                const moduleStats: ModuleStats[] = [];
                for (const [modId, modData] of ueData.modules) {
                    const userMod = userUE?.modules.find(m => m.id === modId);
                    moduleStats.push({
                        moduleId: modId,
                        moduleCode: modData.code,
                        moduleName: modData.name,
                        stats: calculateStats(modData.averages, userMod?.average ?? null)
                    });
                }

                byUE.push({
                    ueId,
                    ueCode: ueData.code,
                    ueName: ueData.name,
                    stats: calculateStats(ueData.averages, userUEAvg),
                    modules: moduleStats
                });
            }

            return {
                name: groupName,
                totalUsers: semesters.length,
                averages: {
                    global: calculateStats(globalAverages, userGlobalAvg),
                    byUE
                }
            };
        };

        // Calculate stats for each level
        const stats: StatsResult = {
            groupe: calculateGroupStats(groupeSemesters, userSemester.groupe),
            filiere: calculateGroupStats(filiereSemesters, userSemester.filiere),
            cursus: calculateGroupStats(cursusSemesters, userSemester.cursus)
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
