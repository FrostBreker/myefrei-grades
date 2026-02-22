import {UserGroupGraphStatsOPTS, UserGroupStatsOPTS} from "@lib/types";
import {GroupRankDB, NumberDeviations, PlottingData, Rank, RankingDB, UserGroupGraphData, UserGroupStats, UserRankDB} from "@lib/stats/types";
import {getUserDisplayNameForRanking} from "@lib/user/checkIfUserShowInStats";

export async function CalculateUserGroupStats(fetchOpts: UserGroupStatsOPTS): Promise<UserGroupStats | null> {
    const {groupName, type, previousRankings, currentRankings, userId, hasBranch} = fetchOpts;
    if (!type || !currentRankings || !userId) {
        return null;
    }

    // Check if groupName is provided for the required types
    if ((!groupName || groupName.length < 1) && (type === 'branch' || type === 'groupe')) {
        return null;
    }

    // Initialize variables for student and group rankings, which will be filtered based on the group name and type (branch, group, spe, or cursus)
    let currentStudentRankings: UserRankDB[] | null = null;
    let previousStudentRankings: UserRankDB[] | null = null;

    // Initialize variables for group rankings, which will be filtered based on the group name and type (branch, group, spe, or cursus). These will be used to calculate the group average and max average for the user's group.
    let currentGroupRankings: GroupRankDB[] | null = null;
    let previousGroupRankings: GroupRankDB[] | null = null;

    if (type === 'branch' && groupName) {
        // Students in branch
        currentStudentRankings = filterStudentRankingsByGroup(currentRankings.studentRankings, groupName, "group", hasBranch);
        if (currentStudentRankings) {
            currentStudentRankings = calculateStudentRankings(currentStudentRankings);
        }
        previousStudentRankings = previousRankings ? filterStudentRankingsByGroup(previousRankings.studentRankings, groupName, "group", hasBranch) : null;
        if (previousStudentRankings) {
            previousStudentRankings = calculateStudentRankings(previousStudentRankings);
        }

        // Groups in branch
        currentGroupRankings = filterGroupRankingsByGroup(currentRankings.groupRankings, groupName, "groupName", hasBranch);
        if (currentGroupRankings) {
            currentGroupRankings = calculateGroupRankings(currentGroupRankings);
        }
        previousGroupRankings = previousRankings ? filterGroupRankingsByGroup(previousRankings.groupRankings, groupName, "groupName", hasBranch) : null;
        if (previousGroupRankings) {
            previousGroupRankings = calculateGroupRankings(previousGroupRankings);
        }
    } else if (type === 'groupe' && groupName) {
        // Students in spe
        currentStudentRankings = filterStudentRankingsByGroup(currentRankings.studentRankings, groupName, "spe", hasBranch);
        if (currentStudentRankings) {
            currentStudentRankings = calculateStudentRankings(currentStudentRankings);
        }
        previousStudentRankings = previousRankings ? filterStudentRankingsByGroup(previousRankings.studentRankings, groupName, "spe", hasBranch) : null;
        if (previousStudentRankings) {
            previousStudentRankings = calculateStudentRankings(previousStudentRankings);
        }

        // Groups in spe
        currentGroupRankings = filterGroupRankingsByGroup(currentRankings.groupRankings, groupName, "spe", hasBranch);
        if (currentGroupRankings) {
            currentGroupRankings = calculateGroupRankings(currentGroupRankings);
        }
        previousGroupRankings = previousRankings ? filterGroupRankingsByGroup(previousRankings.groupRankings, groupName, "spe", hasBranch) : null;
        if (previousGroupRankings) {
            previousGroupRankings = calculateGroupRankings(previousGroupRankings);
        }
    } else if (type === 'filiere' || type === 'cursus') {
        // Students in filiere or cursus
        currentStudentRankings = currentRankings.studentRankings;
        previousStudentRankings = previousRankings ? previousRankings.studentRankings : null;

        // Groups in filiere or cursus
        currentGroupRankings = currentRankings.groupRankings;
        previousGroupRankings = previousRankings ? previousRankings.groupRankings : null;
    }

    const userCurrentRanking = currentStudentRankings ? currentStudentRankings.find(ranking => ranking.userId.toString() === userId.toString()) : null;
    const userPreviousRanking = previousStudentRankings ? previousStudentRankings.find(ranking => ranking.userId.toString() === userId.toString()) : null;

    // Calculate user average and percentage compared to previous ranking
    const userAverage: NumberDeviations = {
        current: userCurrentRanking?.average ?? 0,
        raw: userPreviousRanking ? (userCurrentRanking?.average ?? 0) - userPreviousRanking.average : 0,
    };

    // Calculate group average and percentage compared to previous ranking
    const groupAverage: NumberDeviations = calculateAverage(currentStudentRankings ?? [], previousStudentRankings);
    const max: NumberDeviations = calculateMax(currentStudentRankings ?? [], previousStudentRankings);
    const studentRank: NumberDeviations = {
        current: userCurrentRanking?.rank ?? 0,
        raw: userPreviousRanking ? userPreviousRanking.rank - (userCurrentRanking?.rank ?? 0) : 0,
    };
    const numberOfStudents = currentStudentRankings ? currentStudentRankings.length : 0;
    const studentRankings: Rank[] = currentStudentRankings ? await constructStudentsRank(currentStudentRankings, previousStudentRankings, type === "cursus") : [];
    const groupRankings: Rank[] = currentGroupRankings ? await constructGroupRank(currentGroupRankings, previousGroupRankings ? previousGroupRankings : null) : [];

    return {
        groupName: hasBranch || (type === 'filiere' || type === 'cursus') ? (groupName ?? "") : extractUniqueGroupName(currentStudentRankings ?? []),
        semester: currentRankings.semester,
        userAverage,
        groupAverage,
        max,
        numberOfStudents,
        studentRank,
        studentRankings,
        groupRankings,
    }
}

// CalculateUserGroupGraphStats will calculate the stats for the graph, which is the average of the top 10 students in the group, and the percentage compared to previous ranking
export function CalculateUserGroupGraphStats(fetchOpts: UserGroupGraphStatsOPTS): UserGroupGraphData | null {
    const {groupName, type, rankings, userId, hasBranch} = fetchOpts;
    if (!type || !rankings || !userId) {
        return null;
    }

    // Check if groupName is provided for the required types
    if ((!groupName || groupName.length < 1) && (type === 'branch' || type === 'groupe')) {
        return null;
    }

    // Initialize variables for group rankings, which will be filtered based on the group name and type (branch, group, spe, or cursus). These will be used to calculate the group average and max average for the user's group.
    let currentStudentRankings: UserRankDB[][] = [];
    let currentGroupRankings: { groupName: string, average: number[] }[] | null = null;
    if (type === 'branch' && groupName) {
        // Students in branch
        rankings.forEach(r => {
            let stdRankings
            stdRankings = filterStudentRankingsByGroup(r.studentRankings, groupName, "group", hasBranch);
            if (stdRankings) {
                stdRankings = calculateStudentRankings(stdRankings);
                currentStudentRankings.push(stdRankings);
            }
        });

        currentGroupRankings = extractAverageByGroupName(rankings, groupName, "groupName", hasBranch);
    } else if (type === 'groupe' && groupName) {
        // Students in spe
        rankings.forEach(r => {
            let stdRankings
            stdRankings = filterStudentRankingsByGroup(r.studentRankings, groupName, "spe", hasBranch);
            if (stdRankings) {
                stdRankings = calculateStudentRankings(stdRankings);
                currentStudentRankings.push(stdRankings);
            }
        });
        currentGroupRankings = extractAverageByGroupName(rankings, groupName, "spe", hasBranch);
    } else if (type === 'filiere' || type === 'cursus') {
        // Students in filiere or cursus
        rankings.forEach(r => {
            let stdRankings = r.studentRankings
            currentStudentRankings.push(stdRankings);
        });
        currentGroupRankings = extractAverageByGroupName(rankings, "", "groupName", hasBranch);
    }

    const max: PlottingData = {
        label: "Max",
        data: [],
    }
    const userRanking: PlottingData = {
        label: "User Ranking",
        data: [],
    }
    if (currentStudentRankings) {
        max.data = currentStudentRankings.map((rankings) => {
            return Math.max(...rankings.map(ranking => ranking.average));
        });
        userRanking.data = currentStudentRankings.map((rankings) => {
            const userRanking = rankings.find(r => r.userId.toString() === userId.toString());
            return userRanking ? userRanking.rank : 0;
        });
    }

    const groupAverages: PlottingData[] = currentGroupRankings ? currentGroupRankings.map(group => ({
        label: group.groupName,
        data: group.average,
    })) : [];

    return {
        groupAverages,
        userRanking,
        max,
    }
}

// Filter the student rankings by group name and type (group or spe)
function filterStudentRankingsByGroup(rankings: UserRankDB[], groupName: string, type: "group" | "spe", hasBranch: boolean): UserRankDB[] | null {
    const dismissal: string[] = []; // Not Allowed group name for filter in groups that don't have branch
    rankings.forEach((rank: UserRankDB) => {
        if (rank.group !== rank.spe && !dismissal.includes(rank.spe)) {
            dismissal.push(rank.spe);
        }
    })
    const userGroup = rankings.filter(ranking => {
        if (type === "group") {
            return ranking.group === groupName;
        } else if (type === "spe") {
            if (hasBranch || dismissal.includes(ranking.spe)) {
                return ranking.spe === groupName;
            } else {
                return ranking.spe === ranking.group;
            }
        }
    });

    if (userGroup.length === 0) {
        return null;
    }

    return userGroup;
}

// Filter the group rankings by group name and type (group or spe)
function filterGroupRankingsByGroup(rankings: GroupRankDB[], groupName: string, type: "groupName" | "spe", hasBranch: boolean): GroupRankDB[] | null {
    const dismissal: string[] = []; // Not Allowed group name for filter in groups that don't have branch
    rankings.forEach((rank: GroupRankDB) => {
        if (rank.groupName !== rank.spe && !dismissal.includes(rank.spe)) {
            dismissal.push(rank.spe);
        }
    })
    const groupRank = rankings.filter(ranking => {
        if (type === "groupName") {
            return ranking.groupName === groupName;
        } else if (type === "spe") {
            if (hasBranch || dismissal.includes(ranking.spe)) {
                return ranking.spe === groupName;
            } else {
                return ranking.spe === ranking.groupName;
            }
        }
    });

    if (groupRank.length === 0) {
        return null;
    }

    return groupRank;
}

// Recalculate the rankings for a group based on the current student rankings, and return the top 10 students in the group with their rank and average.
function calculateStudentRankings(studentRankings: UserRankDB[]): UserRankDB[] {
    const sortedRankings = [...studentRankings].sort((a, b) => b.average - a.average);
    return sortedRankings.map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
    }));
}

// Recalculate the rankings for a group based on the current group rankings, and return the top 10 groups in the same branch or group with their rank and average.
function calculateGroupRankings(groupRankings: GroupRankDB[]): GroupRankDB[] {
    const sortedRankings = [...groupRankings].sort((a, b) => b.average - a.average);
    return sortedRankings.map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
    }));
}

// Construct the top 10 students in the group with their rank and average, and calculate the raw difference compared to previous rankings if available.
async function constructStudentsRank(currentRankings: UserRankDB[], previousRankings: UserRankDB[] | null, isCursus: boolean): Promise<Rank[]> {
    const slicedCurrentRankings = currentRankings.slice(0, 10);
    const ranks: Rank[] = [];
    for (const ranking of slicedCurrentRankings) {
        const previousRanking = previousRankings ? previousRankings.find(r => r.userId.toString() === ranking.userId.toString()) : null;
        const displayName: string = await getUserDisplayNameForRanking(ranking.userId);
        ranks.push({
            rank: {
                current: ranking.rank,
                raw: previousRanking ? previousRanking.rank - ranking.rank : 0,
            },
            average: {
                current: ranking.average,
                raw: previousRanking ? ranking.average - previousRanking.average : 0,
            },
            name: displayName + "/-/" + (isCursus ? ranking.group : (ranking.group !== "" && ranking.group ? ranking.group : ranking.spe)),
        });
    }

    return ranks;
}

// Construct the top 10 groups in the same branch or group with their rank and average, and calculate the raw difference compared to previous rankings if available.
async function constructGroupRank(currentRankings: GroupRankDB[], previousRankings: GroupRankDB[] | null): Promise<Rank[]> {
    const ranks: Rank[] = [];
    for (const ranking of currentRankings) {
        const previousRanking = previousRankings ? previousRankings.find(r => r.groupName === ranking.groupName && r.spe === ranking.spe) : null;
        ranks.push({
            rank: {
                current: ranking.rank,
                raw: previousRanking ? previousRanking.rank - ranking.rank : 0,
            },
            average: {
                current: ranking.average,
                raw: previousRanking ? ranking.average - previousRanking.average : 0,
            },
            name: ranking.groupName + "/-/" + ranking.spe,
        });
    }

    return ranks;
}

// Calculate the average for the group and percentage compared to previous ranking
function calculateAverage(currentRankings: UserRankDB[], previousRankings: UserRankDB[] | null): NumberDeviations {
    const currentAverage = currentRankings.reduce((sum, ranking) => sum + ranking.average, 0) / currentRankings.length;
    const previousAverage = previousRankings ? previousRankings.reduce((sum, ranking) => sum + ranking.average, 0) / previousRankings.length : currentAverage;

    return {
        current: currentAverage,
        raw: currentAverage - previousAverage,
    }
}

// Calculate the max average for the group and percentage compared to previous ranking
function calculateMax(currentRankings: UserRankDB[], previousRankings: UserRankDB[] | null): NumberDeviations {
    const currentMax = Math.max(...currentRankings.map(ranking => ranking.average));
    const previousMax = previousRankings ? Math.max(...previousRankings.map(ranking => ranking.average)) : currentMax;

    return {
        current: currentMax,
        raw: currentMax - previousMax,
    }
}

// extractUniqueGroupName will extract unique group name and create a new Group Name with Group 1 & Group 2 & Group 3
function extractUniqueGroupName(studentRankings: UserRankDB[]): string {
    const uniqueGroupNames = Array.from(new Set(studentRankings.map(ranking => ranking.group))).filter(group => group !== "" && group !== null);
    if (uniqueGroupNames.length === 0) {
        return "";
    } else if (uniqueGroupNames.length === 1) {
        return uniqueGroupNames[0];
    } else {
        return uniqueGroupNames.join(" & ");
    }
}

// extract AverageByGroupName will extract the average for each group name and return an array of objects with group name and average
function extractAverageByGroupName(rankings: RankingDB[], groupName: string, type: "groupName" | "spe", hasBranch: boolean): { groupName: string, average: number[] }[] {
    const groupAverages: { groupName: string, average: number[] }[] = [];
    rankings.forEach(ranking => {
        const groups: GroupRankDB[] | null = groupName !== "" ? filterGroupRankingsByGroup(ranking.groupRankings, groupName, type, hasBranch) : ranking.groupRankings;
        groups?.forEach((group) => {
            const existingGroup = groupAverages.find(g => g.groupName === group.groupName);
            if (existingGroup) {
                existingGroup.average.push(group.average);
            } else {
                groupAverages.push({
                    groupName: group.groupName,
                    average: [group.average],
                });
            }
        })
    });

    return groupAverages;
}