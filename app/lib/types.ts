// Share types across lib functions:

// Data needed to fetch the global statistics for a given name, semester and academic year
export interface FetchStatisticsOPTS {
    name: string;
    isCursus: boolean;
    semester: number;
    academicYear: string;
}

// Data needed to fetch the user statistics for a given name, semester and academic year
// export interface FetchStatisticsUserOPTS {
//     name: string;
//     semester: number;
//     academicYear: string;
//
// }

