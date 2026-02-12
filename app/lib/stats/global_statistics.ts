import {GroupRankDB, ObjectStatsDB, RankingDB, UserGroupStats, UserRankDB, UserStats} from "@lib/stats/types";
import clientPromise from "@lib/mongodb";
import {Document, ObjectId, WithId} from "mongodb";
import {UserSemesterDB} from "@lib/grades/types";
import {GetUserSemesterByUserId, GetUsersSemester} from "@lib/userSemesters/users";
import {FetchStatisticsOPTS, FetchStatisticsUserOPTS} from "@lib/types";
import {calculateAverage, calculateMedian, getAveragesArray} from "@lib/stats/utils";
import {calculateGroupRankings} from "@lib/stats/group_rankings";
import {calculateStudentRankings} from "@lib/stats/user_ranking";
import {calculateUEStats} from "@lib/stats/ue_ranking";
import {calculateModuleStats} from "@lib/stats/module_ranking";
import {calculateUserGroupStats} from "@lib/stats/group_stats";

const GRADES_STATS_COLLECTION = 'gradesStats';

interface rankingData {
    lastRanking: RankingDB | null;
    previousRanking: RankingDB | null;
}

// Get the last global statistics for the given name. If there are no statistics, return null.
async function getLastGlobalStatistics(fetchOpts: FetchStatisticsOPTS): Promise<rankingData | null> {
    const client = await clientPromise;
    const db = client.db();

    const documents = db.collection(GRADES_STATS_COLLECTION).find({
        name: fetchOpts.name,
        semester: fetchOpts.semester,
        academicYear: fetchOpts.academicYear,
    }, {
        sort: {date: -1}, // Sort by date descending to get the latest entry
        limit: 2 // Limit to 2 document
    });

    if (!documents) {
        return null
    }

    const s = await documents.toArray();
    const lastRanking = s[0] as WithId<Document> | undefined;
    const previousRanking = s[1] as WithId<Document> | undefined;
    const rankingData: rankingData = {
        lastRanking: null,
        previousRanking: null,
    }

    if (lastRanking) {
        lastRanking.date = new Date(lastRanking.date);
        rankingData.lastRanking = lastRanking as RankingDB | null;
    }

    if (previousRanking) {
        previousRanking.date = new Date(previousRanking.date);
        rankingData.previousRanking = previousRanking as RankingDB | null;
    }


    return rankingData;
}

// Update the global statistics for the given name. If there are existing statistics for the same day, update them. Otherwise, insert a new document.
export async function UpdateLastGlobalStatistics(fetchOpts: FetchStatisticsOPTS, ranking: RankingDB): Promise<void> {
    const existingStats = await getLastGlobalStatistics(fetchOpts);
    const lastStats = existingStats?.lastRanking;
    // Only update if the date is in the same day or if there are no existing stats
    if (lastStats) {
        const existingDate = new Date(lastStats.date);
        const now = new Date();

        if (
            existingDate.getFullYear() === now.getFullYear() &&
            existingDate.getMonth() === now.getMonth() &&
            existingDate.getDate() === now.getDate()
        ) {
            // Same day, update the existing document
            await updateGlobalStatistics(lastStats._id, fetchOpts, ranking);
            return;
        }
    }

    // Different day or no existing stats, insert a new document
    await insertGlobalStatistics(ranking);
}

// Update the existing document for the given name
async function updateGlobalStatistics(_id: ObjectId, fetchOpts: FetchStatisticsOPTS, ranking: RankingDB): Promise<void> {
    const client = await clientPromise;
    const db = client.db();

    // Exclude _id from the update to avoid modifying the immutable field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {_id: _, ...rankingWithoutId} = ranking;

    await db.collection(GRADES_STATS_COLLECTION).updateOne(
        {
            _id: _id,
            name: fetchOpts.name,
            semester: fetchOpts.semester,
            academicYear: fetchOpts.academicYear,
        },
        {$set: {...rankingWithoutId, date: new Date()}}
    );
}

// Insert a new document for the given ranking
async function insertGlobalStatistics(ranking: RankingDB): Promise<void> {
    const client = await clientPromise;
    const db = client.db();

    await db.collection(GRADES_STATS_COLLECTION).insertOne({
        ...ranking,
        date: new Date(),
    });
}

// Construct the global statistics document for the given name, semester and academic year
export async function ConstructGlobalStatisticsDocument(fetchOpts: FetchStatisticsOPTS): Promise<RankingDB | null> {
    const {name, semester, academicYear, isCursus} = fetchOpts;
    if (!name || !semester || !academicYear) {
        return null;
    }

    // Retrieve all users semester matching the criteria
    const usersSemester: UserSemesterDB[] | null = await GetUsersSemester(fetchOpts);
    if (!usersSemester || usersSemester.length === 0) {
        return null;
    }

    // Filter out semesters without averages
    const validSemesters = usersSemester.filter(sem => sem.average !== null && sem.average !== undefined);
    if (validSemesters.length === 0) {
        return null;
    }

    // Get averages for all valid semesters
    const averages: number[] = getAveragesArray(validSemesters);
    if (averages.length === 0) {
        return null;
    }

    // Calculate all statistics
    const average = calculateAverage(averages);
    const median = calculateMedian(averages);
    const min = Math.min(...averages);
    const max = Math.max(...averages);
    const numberOfStudents = averages.length;

    // Calculate group and student rankings
    const groupRankings: GroupRankDB[] | null = await calculateGroupRankings(validSemesters, isCursus);
    const studentRankings: UserRankDB[] | null = await calculateStudentRankings(validSemesters);

    if (groupRankings === null || studentRankings === null) {
        return null;
    }

    // Calculate UE and module statistics
    const ueStats: ObjectStatsDB[] | null = !isCursus ? await calculateUEStats(validSemesters) : null;
    const moduleStats: ObjectStatsDB[] | null = !isCursus ? await calculateModuleStats(validSemesters) : null;

    if (!isCursus && (ueStats === null || moduleStats === null)) {
        return null;
    }

    // Construct the ranking document
    return {
        _id: new ObjectId(),
        date: new Date(),
        semester,
        academicYear,
        name,
        average,
        median: median,
        min: min,
        max: max,
        numberOfStudents: numberOfStudents,
        groupRankings: groupRankings,
        studentRankings: studentRankings,
        ue: ueStats ?? [],
        modules: moduleStats ?? [],
    };
}

// Get the global statistics for a given name, semester and academic year. If there are no statistics, return null.
export async function GetGlobalStatistics(fetchOpts: FetchStatisticsUserOPTS): Promise<UserStats | null> {
    const {semester, academicYear, userId} = fetchOpts;
    if (!userId || !semester || !academicYear) {
        return null;
    }

    const userSemester: UserSemesterDB | null = await GetUserSemesterByUserId(fetchOpts);
    if (!userSemester) {
        return null;
    }

    const overallGlobalStats = await getLastGlobalStatistics({
        name: userSemester.cursus,
        semester,
        academicYear,
        isCursus: true,
    });

    const speGlobalStats = await getLastGlobalStatistics({
        name: userSemester.filiere,
        semester,
        academicYear,
        isCursus: false,
    });

    if (!overallGlobalStats || !overallGlobalStats.lastRanking) {
        return null;
    }

    if (!speGlobalStats || !speGlobalStats.lastRanking) {
        return null;
    }

    const branchStats: UserGroupStats | null = calculateUserGroupStats({
        groupName: userSemester.branch !== "" && userSemester.branch !== null && userSemester.branch !== undefined ? userSemester.branch : null,
        type: 'branch',
        previousRankings: speGlobalStats.previousRanking,
        currentRankings: speGlobalStats.lastRanking,
        userId: userId,
    })

    const groupStats: UserGroupStats | null = calculateUserGroupStats({
        groupName: userSemester.groupe ?? null,
        type: 'groupe',
        previousRankings: speGlobalStats.previousRanking,
        currentRankings: speGlobalStats.lastRanking,
        userId: userId,
    });

    const speStats: UserGroupStats | null = calculateUserGroupStats({
        groupName: userSemester.filiere,
        type: 'filiere',
        previousRankings: speGlobalStats.previousRanking,
        currentRankings: speGlobalStats.lastRanking,
        userId: userId,
    });

    const cursusStats: UserGroupStats | null = calculateUserGroupStats({
        groupName: userSemester.cursus,
        type: 'cursus',
        previousRankings: overallGlobalStats.previousRanking,
        currentRankings: overallGlobalStats.lastRanking,
        userId: userId,
    });


}