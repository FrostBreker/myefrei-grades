// Calculate UE statistics based on the valid semesters
import {UserSemesterDB} from "@lib/grades/types";
import {ObjectStatsDB, UserRankDB} from "@lib/stats/types";
import {calculateAverage, calculateMedian} from "@lib/stats/utils";
import {ObjectId} from "mongodb";
import {rankStudentsByAverage} from "@lib/stats/user_ranking";
import {rankGroupsByAverageFromUserRank} from "@lib/stats/group_rankings";

// Calculate UE statistics based on the valid semesters and return an array of ObjectStatsDB objects containing statistics for each UE, including average, median, min, max, number of students, and rankings.
export async function calculateUEStats(validSemesters: UserSemesterDB[]): Promise<ObjectStatsDB[] | null> {
    // Get unique UE codes from the valid semesters, normalized to remove group-specific suffixes
    const ueCodes = getUECodes(validSemesters);
    if (ueCodes.length === 0) {
        return null;
    }

    const ueStats: ObjectStatsDB[] = [];

    // For each UE code, gather all students who took that UE and calculate statistics
    ueCodes.forEach(code => {
        const ueStudents: UserRankDB[] = [];

        // Iterate through all semesters and UEs to find students who took the UE with the normalized code
        validSemesters.forEach(semester => {
            semester.ues.forEach(ue => {
                const normalizedCode = normalizeUECode(ue.code);
                if (normalizedCode === code && ue.average) {
                    ueStudents.push({
                        userId: new ObjectId(semester.userId),
                        average: ue.average,
                        spe: semester.groupe,
                        group: semester.branch !== "" ? semester.branch ?? semester.groupe : semester.groupe,
                        rank: 0, // Rank will be calculated later
                    });
                }
            });
        });

        // Extract grades for the UE, filtering out null or undefined averages
        const grades = ueStudents.map(student => student.average).filter(avg => avg !== null && avg !== undefined) as number[];
        if (grades.length > 0) {
            // Calculate student and group rankings for the UE
            const studentRankings = rankStudentsByAverage(ueStudents);
            const groupRankings = rankGroupsByAverageFromUserRank(ueStudents);

            // Calculate average, median, min, and max for the UE
            const average = calculateAverage(grades);
            const median = calculateMedian(grades);
            const min = Math.min(...grades);
            const max = Math.max(...grades);

            // Store the statistics for the UE in the ueStats array
            ueStats.push({
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

    return ueStats;
}

// Retrieve all UE Codes from the valid semesters
function getUECodes(validSemesters: UserSemesterDB[]): string[] {
    const ueCodesSet = new Set<string>();

    validSemesters.forEach(semester => {
        semester.ues.forEach(ue => {
            const code = normalizeUECode(ue.code);
            if (!ueCodesSet.has(code)) {
                ueCodesSet.add(code);
            }
        });
    });

    return Array.from(ueCodesSet);
}

/* Normalize UE code by removing group-specific suffixes:
    UE11 -> UE11 (unchanged)
    UE11P -> UE11
    UE13P -> UE13
    UE16BN -> UE16 */
export function normalizeUECode(code: string): string {
    const suffixes = ['PM', 'I', 'P', 'BN'];
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