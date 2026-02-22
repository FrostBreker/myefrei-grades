import React from 'react';
import {UserGroupStats} from "@lib/stats/types";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Users} from "lucide-react";
import {RankDisplay} from "@components/statistics/RankDisplay";
import {TrendIndicator} from "@components/statistics/ComparisonIndicator";
import {levelColors, levelLabels} from "@components/statistics/utils";

interface UserStatsHeaderProps {
    stats: UserGroupStats | null
    level: 'branch' | 'spe' | 'filiere' | 'cursus'
}
function UserStatsHeader({stats, level}: UserStatsHeaderProps) {
    if (!stats || !stats.studentRank || !stats.userAverage || !stats.groupAverage) {
        return <SkeletonUserStatsHeader level={level} />;
    }
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Badge className={levelColors[level]}>{levelLabels[level]}</Badge>
                        <span>{stats?.groupName}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4"/>
                        {stats?.numberOfStudents} étudiants
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {/* User rank */}
                    <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Ton classement</div>
                        <div className="text-lg md:text-xl font-bold">
                            <RankDisplay rank={stats.studentRank.current} total={stats.numberOfStudents}/>
                            <TrendIndicator value={stats.studentRank.raw} />
                        </div>
                    </div>

                    {/* Group average */}
                    <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Moy. groupe</div>
                        <div className="text-lg md:text-xl font-bold">
                            {stats.groupAverage?.current.toFixed(2) ?? "-"}
                            <TrendIndicator value={stats.groupAverage.raw} />
                        </div>
                    </div>

                    {/* User vs group */}
                    <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Ta moyenne</div>
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                <span className="text-lg md:text-xl font-bold">
                                    {stats.userAverage?.current?.toFixed(2) ?? "-"}
                                </span>
                            <TrendIndicator value={stats.userAverage.raw} />
                        </div>
                    </div>

                    {/* Min/Max */}
                    <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Max</div>
                        <div className="text-lg md:text-xl font-bold">
                            <span className="text-green-500">{stats.max?.current?.toFixed(2) ?? "-"}</span>
                            <TrendIndicator value={stats.max?.raw ?? 0} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function SkeletonUserStatsHeader({level}: {level: 'branch' | 'spe' | 'filiere' | 'cursus'}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Badge className={levelColors[level]}>{levelLabels[level]}</Badge>
                        <span className="bg-gray-300 rounded-md w-32 h-5"/>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4"/>
                        <span className="bg-gray-300 rounded-md w-16 h-4"/>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">...</div>
                            <div className="text-lg md:text-xl font-bold">
                                <span className="bg-gray-300 rounded-md w-16 h-5 mx-auto"/>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default UserStatsHeader;