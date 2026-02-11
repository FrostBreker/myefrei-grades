import {UserSemesterDB} from "@lib/grades/types";
import {ObjectId} from "mongodb";
import {UserRankDB} from "@lib/stats/types";

// Calculate student rankings based on the valid semesters
export async function calculateStudentRankings(validSemesters: UserSemesterDB[]): Promise<UserRankDB[] | null> {
    // Sort semesters by average descending
    const sortedSemesters = [...validSemesters].sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

    // Assign ranks to students
    const studentRankings: UserRankDB[] = [];
    for (let i = 0; i < sortedSemesters.length; i++) {
        const sem = sortedSemesters[i];
        studentRankings.push({
            rank: i + 1,
            average: sem.average ?? 0,
            userId: new ObjectId(sem.userId),
            spe: sem.groupe,
            group: sem.branch !== "" ? sem.branch ?? sem.groupe : sem.groupe,
        });
    }

    return studentRankings;
}


// Rank and sort students based on their averages, and return an array of UserRankDB objects with userId, average, spe, group, and rank.
export function rankStudentsByAverage(userRanks: UserRankDB[]): UserRankDB[] {
    // Sort students by average descending
    const sortedStudents = [...userRanks].sort((a, b) => b.average - a.average);

    // Assign ranks to students
    return sortedStudents.map((student, index) => ({
        ...student,
        rank: index + 1, // Rank starts at 1
    }));
}