// Stats card for a specific group level
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Users} from "lucide-react";
import {RankDisplay} from "@components/statistics/RankDisplay";
import {TrendIndicator} from "@components/statistics/ComparisonIndicator";
import {Leaderboard} from "@components/statistics/Leaderboard";
import {UserGroupStats} from "@lib/stats/types";

interface StatsCardProps {
    stats: UserGroupStats | null
    level: 'branch' | 'spe' | 'filiere' | 'cursus'
}
export function StatsCard({stats, level}: StatsCardProps) {
    const levelLabels: Record<string, string> = {
        branch: "Groupe",
        spe: "Spécialité",
        filiere: "Filière",
        cursus: "Cursus"
    };

    const levelColors: Record<string, string> = {
        branch: "bg-green-500",
        spe: "bg-blue-500",
        filiere: "bg-purple-500",
        cursus: "bg-orange-500"
    };

    if (!stats || !stats.studentRank || !stats.userAverage || !stats.groupAverage) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Statistiques non disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Les statistiques pour ce groupe ne sont pas encore disponibles.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <div className="space-y-4">
            {/* Global stats header */}
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

            <div className={"w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"}>
                {/* Leaderboard per Group */}
                {stats.groupRankings && stats.groupRankings.length > 0 && (
                    <Leaderboard data={stats.groupRankings}/>
                )}
                {/*Leaderboard per users*/}
                {stats.studentRankings && stats.studentRankings.length > 0 && (
                    <Leaderboard data={stats.studentRankings} isUser={true}/>
                )}
            </div>
        </div>
    );
}