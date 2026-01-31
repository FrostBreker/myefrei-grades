import {ObjectId} from "mongodb";

export interface User {
    _id: string;
    email: string;
    image: string;
    emailVerified: boolean;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
}

export interface UserDB {
    _id: ObjectId;
    email: string;
    image: string;
    emailVerified: boolean;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
}