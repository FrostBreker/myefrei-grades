import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import clientPromise from "../mongodb";

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return false;
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({
        email: session.user.email
    });

    return user?.role === "admin";
}

/**
 * Get current user with role
 */
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return null;
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({
        email: session.user.email
    });

    if (!user) return null;

    return {
        _id: user._id.toString(),
        email: user.email,
        image: user.image,
        role: user.role || "user"
    };
}
