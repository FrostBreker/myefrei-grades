import {ObjectId} from "mongodb";

export interface User {
    _id: string;
    email: string;
    image: string;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
}

export interface UserDB {
    _id: ObjectId;
    email: string;
    image: string;
    clientIP: string;
    createdAt: Date;
    lastLogin?: Date;
}