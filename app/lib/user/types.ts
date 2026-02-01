import {ObjectId} from "mongodb";

export interface User {
    _id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
    nameInStats?: boolean;
}

export interface UserDB {
    _id: ObjectId;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
    nameInStats?: boolean;
}