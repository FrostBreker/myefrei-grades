interface Ranking {
    name: string;
    average: number;
    rank: number;
}

interface StatsData {
    group: GroupStats & { ranking?: Ranking[] };
    spe: GroupStats & { ranking?: Ranking[] };
    filiere: GroupStats & { ranking?: Ranking[] };
    cursus: GroupStats & { ranking?: Ranking[] };
}

interface StudentRankingsData {
    group: Ranking[];
    spe: Ranking[];
    filiere: Ranking[];
    cursus: Ranking[];
}

interface GroupStats {
    name: string;
    totalUsers: number;
    averages: {
        global: AverageStats;
        byUE: UEStats[];
    };
}

interface AverageStats {
    average: number | null;
    rank: number | null;
    totalWithGrades: number;
    min: number | null;
    max: number | null;
    median: number | null;
}

interface UEStats {
    ueId: string;
    ueCode: string;
    ueName: string;
    stats: AverageStats;
    modules: ModuleStats[];
}

interface ModuleStats {
    moduleId: string;
    moduleCode: string;
    moduleName: string;
    stats: AverageStats;
}

