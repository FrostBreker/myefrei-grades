import {Module, UserSemesterDB} from "@lib/grades/types";
import {Db} from "mongodb";

// Calculate statistics from an array of averages
export function calculateStats(averages: (number | null)[], userAverage: number | null): AverageStats {
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
        if (rank === 0) rank = validAverages.length + 1;
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
export function calculateUEAverage(modules: Module[]): number | null {
    const validModules = modules.filter(m => m.average !== null && m.average !== undefined);
    if (validModules.length === 0) return null;

    const sum = validModules.reduce((acc, m) => acc + (m.average || 0), 0);
    return Math.round((sum / validModules.length) * 100) / 100;
}

// Normalize module code by removing group-specific suffixes
// SM102PM-2526PSA01 -> SM102-2526PSA01
// SM102I-2526PSA01 -> SM102-2526PSA01
// SM102-2526PSA01 -> SM102-2526PSA01 (unchanged)
export function normalizeModuleCode(code: string): string {
    const dashIndex = code.indexOf('-');
    if (dashIndex === -1) return code;

    const beforeDash = code.substring(0, dashIndex);
    const afterDash = code.substring(dashIndex);

    const suffixes = ['PM', 'I', 'P'];
    let normalized = beforeDash;

    for (const suffix of suffixes) {
        if (normalized.endsWith(suffix)) {
            const withoutSuffix = normalized.substring(0, normalized.length - suffix.length);
            if (withoutSuffix.length > 0) {
                normalized = withoutSuffix;
                break;
            }
        }
    }

    return normalized + afterDash;
}

// Normalize UE code by removing group-specific suffixes
// UE11P -> UE11
// UE13P -> UE13
// UE11 -> UE11 (unchanged)
export function normalizeUECode(code: string): string {
    const suffixes = ['PM', 'I', 'P'];
    let normalized = code;

    for (const suffix of suffixes) {
        if (normalized.endsWith(suffix)) {
            const withoutSuffix = normalized.substring(0, normalized.length - suffix.length);
            if (withoutSuffix.length > 0) {
                normalized = withoutSuffix;
                break;
            }
        }
    }

    return normalized;
}

// Calculate rankings by branch within a spe
// For users without branch (null/""), use their "groupe" field as the branch name
// This is used for GROUP level (filtered by groupe)
export async function calculateBranchRankingsForGroup(
    db: Db,
    academicYear: string,
    semester: number,
    groupe: string
): Promise<Ranking[]> {
    const pipeline = [
        {
            $match: {
                academicYear,
                semester,
                groupe // Filter by groupe for GROUP level
            }
        },
        {
            $project: {
                average: 1,
                groupe: 1,
                // Use branch if it exists and is not empty, otherwise use groupe
                effectiveBranch: {
                    $let: {
                        vars: {
                            branchValue: { $ifNull: ["$branch", ""] }
                        },
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$$branchValue", ""] },
                                        { $ne: ["$$branchValue", null] }
                                    ]
                                },
                                then: "$$branchValue",
                                else: "$groupe"
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$effectiveBranch",
                averages: { $push: "$average" },
                count: { $sum: 1 }
            }
        }
    ];

    interface AggregationResult {
        _id: string;
        averages: (number | null)[];
        count: number;
    }

    const results = await db.collection('userSemesters').aggregate(pipeline).toArray() as AggregationResult[];

    const rankings: Ranking[] = results.map((result: AggregationResult) => {
        const validAverages = result.averages.filter((a: number | null): a is number => a !== null);
        const avg = validAverages.length > 0
            ? Math.round((validAverages.reduce((acc: number, val: number) => acc + val, 0) / validAverages.length) * 100) / 100
            : 0;

        return {
            name: result._id,
            average: avg,
            rank: 0 // Will be set after sorting
        };
    });

    // Sort by average descending and assign ranks
    rankings.sort((a: Ranking, b: Ranking) => b.average - a.average);
    rankings.forEach((ranking: Ranking, index: number) => {
        ranking.rank = index + 1;
    });

    return rankings;
}

// Calculate rankings by GROUPE for SPE level (all groupes/branches in the filiere)
// If someone has a branch, use the branch name; if not, use their groupe name
export async function calculateGroupeRankingsForSpe(
    db: Db,
    academicYear: string,
    semester: number,
    filiere: string
): Promise<Ranking[]> {
    const pipeline = [
        {
            $match: {
                academicYear,
                semester,
                filiere // Match by filiere - we want ALL groupes
            }
        },
        {
            $project: {
                average: 1,
                groupe: 1,
                // Use branch if it exists and is not empty, otherwise use groupe
                effectiveGroupe: {
                    $let: {
                        vars: {
                            branchValue: { $ifNull: ["$branch", ""] }
                        },
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$$branchValue", ""] },
                                        { $ne: ["$$branchValue", null] }
                                    ]
                                },
                                then: "$$branchValue",
                                else: "$groupe"
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$effectiveGroupe",
                averages: { $push: "$average" },
                count: { $sum: 1 }
            }
        }
    ];

    interface AggregationResult {
        _id: string;
        averages: (number | null)[];
        count: number;
    }

    const results = await db.collection('userSemesters').aggregate(pipeline).toArray() as AggregationResult[];

    const rankings: Ranking[] = results.map((result: AggregationResult) => {
        const validAverages = result.averages.filter((a: number | null): a is number => a !== null);
        const avg = validAverages.length > 0
            ? Math.round((validAverages.reduce((acc: number, val: number) => acc + val, 0) / validAverages.length) * 100) / 100
            : 0;

        return {
            name: result._id,
            average: avg,
            rank: 0
        };
    });

    rankings.sort((a: Ranking, b: Ranking) => b.average - a.average);
    rankings.forEach((ranking: Ranking, index: number) => {
        ranking.rank = index + 1;
    });

    return rankings;
}

// Calculate rankings by groupe (spe) within a filiere
export async function calculateGroupeRankings(
    db: Db,
    academicYear: string,
    semester: number,
    filiere: string
): Promise<Ranking[]> {
    const pipeline = [
        {
            $match: {
                academicYear,
                semester,
                filiere
            }
        },
        {
            $group: {
                _id: "$groupe",
                averages: { $push: "$average" },
                count: { $sum: 1 }
            }
        }
    ];

    interface AggregationResult {
        _id: string;
        averages: (number | null)[];
        count: number;
    }

    const results = await db.collection('userSemesters').aggregate(pipeline).toArray() as AggregationResult[];

    const rankings: Ranking[] = results.map((result: AggregationResult) => {
        const validAverages = result.averages.filter((a: number | null): a is number => a !== null);
        const avg = validAverages.length > 0
            ? Math.round((validAverages.reduce((acc: number, val: number) => acc + val, 0) / validAverages.length) * 100) / 100
            : 0;

        return {
            name: result._id,
            average: avg,
            rank: 0
        };
    });

    rankings.sort((a: Ranking, b: Ranking) => b.average - a.average);
    rankings.forEach((ranking: Ranking, index: number) => {
        ranking.rank = index + 1;
    });

    return rankings;
}

// Calculate rankings by filiere within a cursus
export async function calculateFiliereRankings(
    db: Db,
    academicYear: string,
    semester: number,
    cursus: string
): Promise<Ranking[]> {
    const pipeline = [
        {
            $match: {
                academicYear,
                semester,
                cursus
            }
        },
        {
            $group: {
                _id: "$filiere",
                averages: { $push: "$average" },
                count: { $sum: 1 }
            }
        }
    ];

    interface AggregationResult {
        _id: string;
        averages: (number | null)[];
        count: number;
    }

    const results = await db.collection('userSemesters').aggregate(pipeline).toArray() as AggregationResult[];

    const rankings: Ranking[] = results.map((result: AggregationResult) => {
        const validAverages = result.averages.filter((a: number | null): a is number => a !== null);
        const avg = validAverages.length > 0
            ? Math.round((validAverages.reduce((acc: number, val: number) => acc + val, 0) / validAverages.length) * 100) / 100
            : 0;

        return {
            name: result._id,
            average: avg,
            rank: 0
        };
    });

    rankings.sort((a: Ranking, b: Ranking) => b.average - a.average);
    rankings.forEach((ranking: Ranking, index: number) => {
        ranking.rank = index + 1;
    });

    return rankings;
}


export function calculateLevelStats(
    semesters: UserSemesterDB[],
    groupName: string,
    userGlobalAvg: number | null,
    userUEAverages: Array<{
        id: string;
        code: string;
        name: string;
        average: number | null;
        modules: Array<{
            id: string;
            code: string;
            name: string;
            average: number | null;
        }>;
    }>,
    shouldNormalize: boolean,
    includeModules: boolean
): GroupStats {
    // Collect global averages
    const globalAverages = semesters.map(s => s.average);

    if (shouldNormalize) {
        // For filiere and cursus: merge UEs with same normalized code
        const mergedUEMap = new Map<string, {
            ueIds: Set<string>;
            code: string;
            name: string;
            averages: (number | null)[];
            modules: Map<string, {
                id: string;
                code: string;
                name: string;
                averages: (number | null)[];
                normalizedCode: string;
            }>;
        }>();

        // First pass: collect all UEs and modules by normalized UE code
        for (const sem of semesters) {
            for (const ue of sem.ues) {
                const normalizedUECode = normalizeUECode(ue.code);

                if (!mergedUEMap.has(normalizedUECode)) {
                    mergedUEMap.set(normalizedUECode, {
                        ueIds: new Set(),
                        code: normalizedUECode,
                        name: ue.name,
                        averages: [],
                        modules: new Map()
                    });
                }

                const mergedUE = mergedUEMap.get(normalizedUECode)!;
                mergedUE.ueIds.add(ue.id);

                const ueAvg = ue.average ?? calculateUEAverage(ue.modules);
                mergedUE.averages.push(ueAvg);

                // Collect modules only if needed
                if (includeModules) {
                    for (const mod of ue.modules) {
                        const normalizedModCode = normalizeModuleCode(mod.code);

                        if (!mergedUE.modules.has(normalizedModCode)) {
                            mergedUE.modules.set(normalizedModCode, {
                                id: mod.id,
                                code: mod.code,
                                name: mod.name,
                                averages: [],
                                normalizedCode: normalizedModCode
                            });
                        }
                        mergedUE.modules.get(normalizedModCode)!.averages.push(mod.average ?? null);
                    }
                }
            }
        }

        // Second pass: filter to only user's UEs and build stats
        const byUE: UEStats[] = [];

        for (const userUE of userUEAverages) {
            const normalizedUECode = normalizeUECode(userUE.code);
            const mergedUE = mergedUEMap.get(normalizedUECode);

            if (!mergedUE) continue; // Skip if UE not found

            // Build module stats - only for modules user has (and only if includeModules is true)
            const moduleStats: ModuleStats[] = [];

            if (includeModules) {
                for (const userMod of userUE.modules) {
                    const normalizedModCode = normalizeModuleCode(userMod.code);
                    const mergedMod = mergedUE.modules.get(normalizedModCode);

                    if (mergedMod) {
                        moduleStats.push({
                            moduleId: userMod.id,
                            moduleCode: userMod.code, // Use user's code
                            moduleName: userMod.name,
                            stats: calculateStats(mergedMod.averages, userMod.average)
                        });
                    }
                }
            }

            byUE.push({
                ueId: userUE.id,
                ueCode: userUE.code, // Use user's UE code
                ueName: userUE.name,
                stats: calculateStats(mergedUE.averages, userUE.average),
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

    } else {
        // No normalization - exact ID matching (for group and spe)
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

                // Collect modules only if needed
                if (includeModules) {
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
        }

        // Build UE stats with user's rank
        const byUE: UEStats[] = [];
        for (const userUE of userUEAverages) {
            const ueData = ueStatsMap.get(userUE.id);

            if (!ueData) continue; // Skip if UE not found in collected data

            const moduleStats: ModuleStats[] = [];

            // Build module stats only if includeModules is true
            if (includeModules) {
                for (const userMod of userUE.modules) {
                    const modData = ueData.modules.get(userMod.id);

                    if (modData) {
                        moduleStats.push({
                            moduleId: userMod.id,
                            moduleCode: modData.code,
                            moduleName: modData.name,
                            stats: calculateStats(modData.averages, userMod.average)
                        });
                    }
                }
            }

            byUE.push({
                ueId: userUE.id,
                ueCode: ueData.code,
                ueName: ueData.name,
                stats: calculateStats(ueData.averages, userUE.average),
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
    }
}