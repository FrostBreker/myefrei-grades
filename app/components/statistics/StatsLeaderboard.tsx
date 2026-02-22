import React, {Fragment} from 'react';
import {UserGroupStats} from "@lib/stats/types";
import {Leaderboard} from "@components/statistics/Leaderboard";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface StatsCardProps {
    stats: UserGroupStats | null
}
function StatsLeaderboard({stats}: StatsCardProps) {
    if (!stats || !stats.studentRank || !stats.userAverage || !stats.groupAverage) {
        return <SkeletonLeaderboardStats />;
    }
    return (
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
    );
}

export function SkeletonLeaderboardStats() {
    const placeholderItems = Array.from({length: 10}, (_, i) => i); // Create an array of 5 items for placeholders
    return (
        <div className={"w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"}>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                        <div className="h-4 bg-muted/50 rounded w-1/3 animate-pulse" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {placeholderItems.map((item) => (
                        <Fragment key={item}>
                            <div className="h-4 bg-muted/50 rounded w-full animate-pulse mb-2" />
                        </Fragment>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                        <div className="h-4 bg-muted/50 rounded w-1/3 animate-pulse" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {placeholderItems.map((item) => (
                        <Fragment key={item}>
                            <div className="h-4 bg-muted/50 rounded w-full animate-pulse mb-2" />
                        </Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default StatsLeaderboard;