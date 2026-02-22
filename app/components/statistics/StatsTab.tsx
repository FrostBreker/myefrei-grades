import React from 'react';
import {UserGraphData, UserGroupStats} from "@lib/stats/types";
import {UE} from "@lib/grades/types";
import {UEList} from "@components/statistics/ModulesList";
import StatsLeaderboard from "@components/statistics/StatsLeaderboard";
import UserStatsHeader from "@components/statistics/UserStatsHeader";
import StatsGraph from "@components/statistics/StatsGraph";

interface StatsTabProps {
    stats: UserGroupStats | null
    level: 'branch' | 'spe' | 'filiere' | 'cursus'
    semesterId: string
    ues: UE[]
    graph: UserGraphData | null
}

function StatsTab({stats, level, semesterId, ues, graph}: StatsTabProps) {
    let type: "branch" | "group" | "spe" | "overall";
    switch (level) {
        case "branch":
            type = "branch";
            break;
        case "spe":
            type = "group";
            break;
        case "filiere":
            type = "spe";
            break;
        case "cursus":
            type = "overall";
            break;
    }
    return (
        <div className="space-y-4">
            <UserStatsHeader stats={stats} level={level} />
            <StatsGraph graphData={graph} type={type} />
            <StatsLeaderboard stats={stats} />
            {level !== "cursus" && <UEList ues={ues} semesterId={semesterId}/>}
        </div>
    );
}

export default StatsTab;