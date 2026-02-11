import {UserSemesterDB} from "@lib/grades/types";
import {FetchStatisticsOPTS} from "@lib/types";
import clientPromise from "@lib/mongodb";
import {WithId} from "mongodb";

const USER_SEMESTERS_COLLECTION = 'userSemesters';

// This function will retrieve all users semester based on the fetchOpts argument. It will return an array of UserSemesterDB objects.
export async function GetUsersSemester(fetchOpts: FetchStatisticsOPTS): Promise<UserSemesterDB[] | null> {
    const {name, semester, academicYear, isCursus} = fetchOpts;

    if (!name || !semester || !academicYear) {
        return null;
    }

    const client = await clientPromise;
    const db = client.db();

    // Based on isCursus, we will search for either cursus or filiere in the database with the provided name.
    const searchField = isCursus ? 'cursus' : 'filiere';
    // Find all user semesters matching the criteria, sorted by updatedAt descending to get the latest entries first
    const userSemesters: WithId<UserSemesterDB>[] = await db.collection<UserSemesterDB>(USER_SEMESTERS_COLLECTION).find({
        [searchField]: name,
        semester,
        academicYear,
    }, {
        sort: {updatedAt: -1}, // Sort by createdAt descending to get the latest entries first
    }).toArray();

    // If no user semesters are found, return null
    if (!userSemesters || userSemesters.length === 0) {
        return null;
    }

    return userSemesters
}