import {WithId, Document, ObjectId} from "mongodb";
import {Session} from "next-auth";
import {NextRequest} from "next/server";
import clientPromise from "../mongodb";
import {User, UserDB} from "@lib/user/types";

export async function getUserBySession(session: Session | null, request: NextRequest): Promise<User | null> {
    if (!session || !session.user?.email) return null;
    // Get the mongoDB Client
    const client = await clientPromise;
    const db = client.db();

    // Check if user exists in DB
    const userDocument: WithId<Document> | null = await db.collection('users').findOne({email: session.user.email});
    const clientIP = request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip') || '';

    let userDB: UserDB | null = userDocument as UserDB | null;

    if (!userDocument) {
        // User does not exist so we create it
        userDB = {
            _id: new ObjectId(),
            email: session.user.email,
            image: session.user.image || '',
            clientIP,
            createdAt: new Date(),
        };
        // Save to DB
        await db.collection('users').insertOne(userDB);
    } else if (userDB) {
        // Update user info
        const newData: Partial<UserDB> = {
            image: session.user.image || '',
            clientIP,
            lastLogin: new Date(),
        };

        // Add createdAt if it doesn't exist (for existing users before this field was added)
        if (!userDB.createdAt) {
            newData.createdAt = new Date();
        }

        // We update the data at each login to make sure we got the freshest info
        await db.collection('users').updateOne(
            {email: session.user.email},
            {$set: newData}
        );
        // Merge the new data into userDB
        userDB = {
            ...userDB,
            ...newData,
        } as UserDB;
    }

    if (!userDB) return null;

    return {
        _id: userDB._id.toString() as unknown as string,
        email: userDB.email,
        image: userDB.image,
        clientIP: userDB.clientIP,
        createdAt: userDB.createdAt,
        lastLogin: userDB.lastLogin,
        firstName: userDB.firstName,
        lastName: userDB.lastName,
        studentNumber: userDB.studentNumber,
    };
}

export type {User};