import {ObjectId, WithId} from "mongodb";
import clientPromise from "@lib/mongodb";
import {UserDB} from "@lib/user/types";

const USER_COL = "users";

export async function getUserDisplayNameForRanking(userId: ObjectId): Promise<string> {
    // Determine display name based on nameInStats field
    let displayName = "John Doe";

    if (!userId) {
        return displayName;
    }

    // Get the mongoDB Client
    const client = await clientPromise;
    const db = client.db();

    const user: WithId<UserDB> | null = await db.collection<UserDB>(USER_COL).findOne({_id: userId});
    if (!user) {
        return displayName;
    }


    const nameInStats = user.nameInStats;

    if (nameInStats) {
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
    }

    return displayName;
}