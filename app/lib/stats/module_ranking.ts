// Calculate module statistics based on the valid semesters
import {UserSemesterDB} from "@lib/grades/types";
import {ObjectStatsDB, UserRankDB} from "@lib/stats/types";
import {rankGroupsByAverageFromUserRank} from "@lib/stats/group_rankings";
import {calculateAverage, calculateMedian} from "@lib/stats/utils";
import {ObjectId} from "mongodb";
import {rankStudentsByAverage} from "@lib/stats/user_ranking";
import {normalizeUECode} from "@lib/stats/ue_ranking";

export async function calculateModuleStats(validSemesters: UserSemesterDB[]): Promise<ObjectStatsDB[] | null> {
    // Get unique module codes from the valid semesters, normalized to remove group-specific suffixes
    const moduleCodes = getModuleCodes(validSemesters);
    if (moduleCodes.length === 0) {
        return null;
    }

    const moduleStats: ObjectStatsDB[] = [];

    // For each module code, gather all students who took that module and calculate statistics
    moduleCodes.forEach(code => {
        const moduleStudents: UserRankDB[] = [];

        // Iterate through all semesters and UEs to find students who took the module with the normalized code
        validSemesters.forEach(semester => {
            semester.ues.forEach(ue => {
                const ueCode = normalizeUECode(ue.code);
                ue.modules.forEach(module => {
                    const normalizedModuleCode = ueCode + "/-/" + normalizeModuleCode(module.code);
                    if (normalizedModuleCode === code && module.average) {
                        moduleStudents.push({
                            rank: 0, // Rank will be calculated later
                            average: module.average,
                            userId: new ObjectId(semester.userId),
                            spe: semester.groupe,
                            group: semester.branch !== "" ? semester.branch ?? semester.groupe : semester.groupe,
                        });
                    }
                });
            });
        });

        // Extract grades for the module, filtering out null or undefined averages
        const grades = moduleStudents.map(student => student.average).filter(avg => avg !== null && avg !== undefined) as number[];
        if (grades.length > 0) {
            // Calculate student and group rankings for the module
            const studentRankings = rankStudentsByAverage(moduleStudents);
            const groupRankings = rankGroupsByAverageFromUserRank(moduleStudents);

            // Calculate average, median, min, and max for the module
            const average = calculateAverage(grades);
            const median = calculateMedian(grades);
            const min = Math.min(...grades);
            const max = Math.max(...grades);

            // Store the statistics for the module in the moduleStats array
            moduleStats.push({
                code,
                average,
                min,
                max,
                median,
                numberOfStudents: grades.length,
                groupRankings: groupRankings,
                studentRankings: studentRankings,
            });
        }
    });

    return moduleStats;
}

// Retrieve unique module codes from the valid semesters, normalized to remove group-specific suffixes
function getModuleCodes(validSemesters: UserSemesterDB[]): string[] {
    const moduleCodeSet = new Set<string>();

    validSemesters.forEach(semester => {
        semester.ues.forEach(ue => {
            const ueCode = normalizeUECode(ue.code);
            ue.modules.forEach(module => {
                const normalizedCode = ueCode + "/-/" + normalizeModuleCode(module.code);
                moduleCodeSet.add(normalizedCode);
            });
        });
    });

    return Array.from(moduleCodeSet);
}

/* Normalize module code by removing group-specific suffixes:
    SM102PM-2526PSA01 -> SM102-2526PSA01
    SM102I-2526PSA01 -> SM102-2526PSA01
    SM102-2526PSA01 -> SM102-2526PSA01 (unchanged) */
function normalizeModuleCode(code: string): string {
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