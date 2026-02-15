import {ObjectId} from "mongodb";

export interface UserRankDB {
    rank: number;
    average: number;
    userId: ObjectId; // Store userId instead of name for privacy (we can fetch names separately to create the top 10 with names if needed)
    spe: string;
    group: string;
}

export interface GroupRankDB {
    rank: number;
    average: number;
    groupName: string;
    spe: string;
}

export interface RankingDB {
    _id: ObjectId;
    date: Date;
    semester: number; // 1, 2, 3, 4, 5, 6
    academicYear: string; // "2023-2024"
    name: string; // "P1", "PGE"
    average: number;
    min: number | null;
    max: number | null;
    median: number | null;
    numberOfStudents: number;
    groupRankings: GroupRankDB[];
    studentRankings: UserRankDB[];
    ue: ObjectStatsDB[];
    modules: ObjectStatsDB[];
}

export interface ObjectStatsDB {
    code: string;
    average: number | null;
    min: number | null;
    max: number | null;
    median: number | null;
    numberOfStudents: number;
    groupRankings: GroupRankDB[];
    studentRankings: UserRankDB[];
}

export interface UserStats {
    userId: string;
    semester: number;
    branch: UserGroupStats | null;
    group: UserGroupStats | null;
    spe: UserGroupStats | null;
    overall: UserGroupStats | null;
}

export interface UserGroupStats {
    groupName: string;
    semester: number;
    userAverage: NumberDeviations | null; // Profit & Loss Average for the student compared to the group average
    groupAverage: NumberDeviations | null; // Average for the group
    max: NumberDeviations | null;
    numberOfStudents: number;
    studentRank: NumberDeviations | null; // Rank of the student within the group
    studentRankings: Rank[] | []; // Top 10 students in the group
    groupRankings: Rank[] | []; // Top 10 groups in the same branch or group
}

export interface Rank {
    rank: NumberDeviations;
    average: NumberDeviations;
    name: string; // Can be user name or group name depending on context
}

// Will represent the user average for example, how much he loose or gain compare to last calculation
export interface NumberDeviations {
    current: number;
    raw: number;
}