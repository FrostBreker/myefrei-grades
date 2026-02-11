import {UserSemesterDB} from "@lib/grades/types";
import {GroupRankDB, UserRankDB} from "@lib/stats/types";

// Calculate group rankings based on the valid semesters
export async function calculateGroupRankings(validSemesters: UserSemesterDB[], isCursus: boolean): Promise<GroupRankDB[] | null> {
    // Group semesters by group and calculate average for each group
    const groupMap: Map<string, { average: number; numberOfStudents: number; spe: string; }> = new Map();

    validSemesters.forEach(sem => {
        const group = sem.branch;
        const spe = sem.groupe;
        const groupName = spe + "/-/" + (isCursus ? sem.filiere : (group !== "" && group !== null && group !== undefined ? group : spe));
        if (!groupMap.has(groupName)) {
            groupMap.set(groupName, {average: 0, numberOfStudents: 0, spe});
        }
        const groupData = groupMap.get(groupName);
        if (groupData) {
            groupData.average += sem.average ?? 0;
            groupData.numberOfStudents += sem.average ? 1 : 0;
        }
    });

    // Convert the map to an array and calculate final average for each group
    const groupRankings: GroupRankDB[] = [];
    for (const [groupName, data] of groupMap.entries()) {
        const average = data.numberOfStudents > 0 ? data.average / data.numberOfStudents : 0;
        groupRankings.push({
            rank: 0,
            average,
            groupName: groupName.split("/-/")[1], // Extract group name without spe for display
            spe: data.spe,
        });
    }

    // Sort groups by average descending
    groupRankings.sort((a, b) => b.average - a.average);

    // Assign ranks to groups
    for (let i = 0; i < groupRankings.length; i++) {
        groupRankings[i].rank = i + 1;
    }

    return groupRankings;
}

// Rank and sort groups based on their averages, and return an array of GroupRankDB objects with groupName, average, spe, and rank.
export function rankGroupsByAverageFromUserRank(userRanks: UserRankDB[]): GroupRankDB[] {
    // Group by groupName and spe
    const groupMap: Map<string, { average: number; studentNumber: number; spe: string; }> = new Map();

    userRanks.forEach(user => {
        const group = user.group;
        const spe = user.spe;
        const groupName = spe + "/-/" + (group !== "" && group !== null && group !== undefined ? group : spe);
        if (!groupMap.has(groupName)) {
            groupMap.set(groupName, {average: 0, studentNumber: 0, spe});
        }
        const groupData = groupMap.get(groupName);
        if (groupData) {
            groupData.average += user.average;
            groupData.studentNumber += 1;
        }
    });

    // Convert the map to an array and calculate final average for each group
    const groupRankings: GroupRankDB[] = [];
    for (const [groupName, data] of groupMap.entries()) {
        const average = data.studentNumber > 0 ? data.average / data.studentNumber : 0;
        groupRankings.push({
            rank: 0,
            average: average,
            groupName: groupName.split("/-/")[1], // Extract group name without spe for display
            spe: data.spe,
        });
    }

    // Sort groups by average descending
    groupRankings.sort((a, b) => b.average - a.average);

    // Assign ranks to groups
    for (let i = 0; i < groupRankings.length; i++) {
        groupRankings[i].rank = i + 1;
    }

    return groupRankings;
}