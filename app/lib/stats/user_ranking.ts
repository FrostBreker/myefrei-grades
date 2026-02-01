import {UserSemesterDB} from "@lib/grades/types";
import {UserDB} from "@lib/user/types";
import {Db} from "mongodb";

export async function getStudentRankings(
    db: Db,
    matchCriteria: object,
    limit: number
): Promise<Ranking[]> {
    // Get all semesters matching criteria, sorted by average
    const semesters = await db.collection<UserSemesterDB>('userSemesters')
        .find(matchCriteria)
        .sort({average: -1}) // Sort by average descending
        .toArray();

    // Filter out students without averages and get top N
    const validSemesters = semesters
        .filter(sem => sem.average !== null && sem.average !== undefined)
        .slice(0, limit);

    if (validSemesters.length === 0) {
        return [];
    }

    // Get user IDs to fetch user data
    const userIds = validSemesters.map(sem => sem.userId);

    // Fetch all users in one query
    const users = await db.collection<UserDB>('users')
        .find({_id: {$in: userIds}})
        .toArray();

    // Create a map for quick user lookup
    const userMap = new Map<string, UserDB>();
    users.forEach((user: UserDB) => {
        userMap.set(user._id.toString(), user);
    });

    // Build rankings
    return validSemesters.map((semester, index) => {
        const user = userMap.get(semester.userId.toString());

        // Determine display name based on nameInStats field
        let displayName = "John Doe";
        if (user) {
            const nameInStats = (user as UserDB).nameInStats; // TypeScript workaround for field that doesn't exist yet

            if (nameInStats) {
                // Show real name if user has opted in
                const firstName = user.firstName || "";
                const lastName = user.lastName || "";
                const name = user.name || "";

                if (firstName && lastName) {
                    displayName = `${firstName} ${lastName}`;
                } else if (name) {
                    displayName = name;
                } else if (firstName) {
                    displayName = firstName;
                } else if (lastName) {
                    displayName = lastName;
                }
                // If both are empty, keep "John Doe"
            }
            // If nameInStats is false, null, undefined, keep "John Doe"
        }
        return {
            name: displayName + "/-/" + (semester.branch !== "" && semester.branch ? semester.branch : semester.groupe),
            average: semester.average!,
            rank: index + 1,
        };
    });
}