import {ObjectId} from "mongodb";

export interface User {
    _id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    emailEfrei: string;
    verificationCode?: number | null;
    verificationCodeExpiry?: Date | null;
    verificationAttempts?: number | null;
    lastVerificationSent?: Date | null;
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
    emailEfrei: string;
    verificationCode?: number | null;
    verificationCodeExpiry?: Date | null;
    verificationAttempts?: number | null;
    lastVerificationSent?: Date | null;
    image: string;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
    nameInStats?: boolean;
}