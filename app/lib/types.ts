// Share types across lib functions:

// Data needed to fetch the global statistics for a given name, semester and academic year
import {ObjectId} from "mongodb";
import {RankingDB} from "@lib/stats/types";

export interface FetchStatisticsOPTS {
    name: string;
    isCursus: boolean;
    semester: number;
    academicYear: string;
}

// Data needed to fetch the user statistics for a given name, semester and academic year
export interface FetchStatisticsUserOPTS {
    semester: number;
    academicYear: string;
    userId: ObjectId;
}

// Data needed to construct user group stats
export interface UserGroupStatsOPTS {
    groupName: string | null;
    type: 'branch' | 'groupe' | 'filiere' | 'cursus';
    previousRankings: RankingDB | null;
    currentRankings: RankingDB;
    userId: ObjectId;
    hasBranch: boolean;
}

// Data needed to construct the stats graph for a user, with the different levels (branch, group, spe, overall)
export interface UserGroupGraphStatsOPTS {
    groupName: string | null;
    type: 'branch' | 'groupe' | 'filiere' | 'cursus';
    rankings: RankingDB[];
    userId: ObjectId;
    hasBranch: boolean;
}