import {UserGroupStatsOPTS} from "@lib/types";
import {NumberDeviations, Rank, UserGroupStats, UserRankDB} from "@lib/stats/types";

export async function calculateUserGroupStats(fetchOpts: UserGroupStatsOPTS): Promise<UserGroupStats | null> {
    const {groupName, type, previousRankings, currentRankings, userId} = fetchOpts;
    if (!type || !currentRankings || !userId) {
        return null;
    }

    let currentStudentRankings: UserRankDB[] | null = null;
    let previousStudentRankings: UserRankDB[] | null = null;

    if (type === 'branch' && groupName !== null) {
        currentStudentRankings = filterRankingsByGroup(currentRankings.studentRankings, groupName, "group");
        if (currentStudentRankings) {
            currentStudentRankings = calculateStudentRankings(currentStudentRankings);
        }
        previousStudentRankings = previousRankings ? filterRankingsByGroup(previousRankings.studentRankings, groupName, "group") : null;
        if (previousStudentRankings) {
            previousStudentRankings = calculateStudentRankings(previousStudentRankings);
        }
    } else if (type === 'groupe' && groupName !== null) {
        currentStudentRankings = filterRankingsByGroup(currentRankings.studentRankings, groupName, "spe");
        if (currentStudentRankings) {
            currentStudentRankings = calculateStudentRankings(currentStudentRankings);
        }
        previousStudentRankings = previousRankings ? filterRankingsByGroup(previousRankings.studentRankings, groupName, "spe") : null;
        if (previousStudentRankings) {
            previousStudentRankings = calculateStudentRankings(previousStudentRankings);
        }
    } else if (type === 'filiere' || type === 'cursus') {
        currentStudentRankings = currentRankings.studentRankings;
        previousStudentRankings = previousRankings ? previousRankings.studentRankings : null;
    }

    const userCurrentRanking = currentStudentRankings ? currentStudentRankings.find(ranking => ranking.userId.toString() === userId.toString()) : null;
    const userPreviousRanking = previousStudentRankings ? previousStudentRankings.find(ranking => ranking.userId.toString() === userId.toString()) : null;

    if (!userCurrentRanking) {
        return null;
    }

    // Calculate user average and percentage compared to previous ranking
    const userAverage: NumberDeviations = {
        current: userCurrentRanking.average,
        raw: userPreviousRanking ? userCurrentRanking.average - userPreviousRanking.average : 0,
    };


    // Calculate group average and percentage compared to previous ranking
    const groupAverage: NumberDeviations = calculateAverage(currentStudentRankings ?? [], previousStudentRankings);

    const max: NumberDeviations = calculateMax(currentStudentRankings ?? [], previousStudentRankings);
    const studentRank: NumberDeviations = {
        current: userCurrentRanking.rank,
        raw: userPreviousRanking ? userCurrentRanking.rank - userPreviousRanking.rank : 0,
    };

    const numberOfStudents = currentStudentRankings ? currentStudentRankings.length : 0;
    const studentRankings: Rank[] = currentStudentRankings ? await constructStudentsRank(currentStudentRankings, previousStudentRankings) : [];
    // const groupRankings: Rank[] = currentRankings.groupRankings ? await constructRank(currentRankings.groupRankings, previousRankings ? previousRankings.groupRankings : null) : [];


}

// Filter the rankings by group name and type (group or spe)
function filterRankingsByGroup(rankings: UserRankDB[], groupName: string, type: "group" | "spe"): UserRankDB[] | null {
    const userGroup = rankings.filter(ranking => {
        return ranking[type] === groupName;
    });

    if (userGroup.length === 0) {
        return null;
    }

    return userGroup;
}

// Recalculate the rankings for a group based on the current student rankings, and return the top 10 students in the group with their rank and average.
function calculateStudentRankings(studentRankings: UserRankDB[]): UserRankDB[] {
    const sortedRankings = [...studentRankings].sort((a, b) => b.average - a.average);
    return sortedRankings.map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
    }));
}

// Construct the top 10 students in the group with their rank and average, and calculate the raw difference compared to previous rankings if available.
async function constructStudentsRank(currentRankings: UserRankDB[], previousRankings: UserRankDB[] | null): Promise<Rank[]> {
    const slicedCurrentRankings = currentRankings.slice(0, 10);
    const ranks: Rank[] = [];
    for (const ranking of slicedCurrentRankings) {
        const previousRanking = previousRankings ? previousRankings.find(r => r.userId.toString() === ranking.userId.toString()) : null;
        ranks.push({
            rank: {
                current: ranking.rank,
                raw: previousRanking ? ranking.rank - previousRanking.rank : 0,
            },
            average: {
                current: ranking.average,
                raw: previousRanking ? ranking.average - previousRanking.average : 0,
            },
            // TODO: CONSTRUCT NAME FROM USER ID
            name: ranking.userId.toString(), // You can replace this with the actual user name if you have it available
        });
    }

    return ranks;
}

// Calculate the average for the group and percentage compared to previous ranking
function calculateAverage(currentRankings: UserRankDB[], previousRankings: UserRankDB[] | null): NumberDeviations {
    const currentAverage = currentRankings.reduce((sum, ranking) => sum + ranking.average, 0) / currentRankings.length;
    const previousAverage = previousRankings ? previousRankings.reduce((sum, ranking) => sum + ranking.average, 0) / previousRankings.length : currentAverage;

    const percentage = (currentAverage / previousAverage - 1) * 100;

    return {
        current: currentAverage,
        previous: previousAverage,
        percentage,
    }
}

// Calculate the max average for the group and percentage compared to previous ranking
function calculateMax(currentRankings: UserRankDB[], previousRankings: UserRankDB[] | null): NumberDeviations {
    const currentMax = Math.max(...currentRankings.map(ranking => ranking.average));
    const previousMax = previousRankings ? Math.max(...previousRankings.map(ranking => ranking.average)) : currentMax;

    const percentage = (currentMax / previousMax - 1) * 100;

    return {
        current: currentMax,
        previous: previousMax,
        percentage,
    }
}