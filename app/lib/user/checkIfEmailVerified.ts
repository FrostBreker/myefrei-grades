import { WithId, Document } from "mongodb";
import { UserDB } from "@lib/user/types";
import { isEmailServiceRateLimited } from "@lib/email/emailServiceState";

export function checkIfEmailVerified(user: WithId<Document>): boolean {
    // If email service is rate limited, bypass the check
    // Users can proceed without verification until limit resets
    if (isEmailServiceRateLimited()) {
        return true;
    }

    if (!user) {
        return false;
    }

    const userTyped = user as unknown as UserDB;

    return userTyped.emailVerified === true;
}
