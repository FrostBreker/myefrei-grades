import {WithId, Document} from "mongodb";
import {UserDB} from "@lib/user/types";

export function checkIfProfileComplete(user: WithId<Document>): boolean {
    if (!user) {
        return false;
    }

    const userTyped = user as unknown as UserDB;

    return !(!userTyped.firstName || !userTyped.lastName || !userTyped.studentNumber || !userTyped.nameInStats);

}