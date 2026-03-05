"use client";
import React from 'react';
import {PlottingData, UserGraphData, UserGroupGraphData} from "@lib/stats/types";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface StatsGraphProps {
    graphData: UserGraphData | null;
    type: "branch" | "group" | "spe" | "overall";
}

const USER_AVG_COLOR = "#6366f1";   // indigo  – the hero line
const MAX_COLOR      = "#10b981";   // emerald – ceiling reference
const GROUP_COLORS   = [
    "#f59e0b", "#3b82f6", "#ec4899",
    "#14b8a6", "#f97316", "#8b5cf6",
];

function CustomTooltip({active, payload, label}: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-background border border-border rounded-lg shadow-xl p-3 text-xs space-y-1 min-w-40">
            <p className="font-semibold text-muted-foreground mb-2">
                {label instanceof Date ? label.toLocaleDateString("fr-FR", {month: "short", year: "numeric"}) : String(label)}
            </p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full" style={{background: entry.color}}/>
                        {entry.name}
                    </span>
                    <span className="font-bold tabular-nums">
                        {typeof entry.value === "number" ? entry.value.toFixed(2) : "–"}
                    </span>
                </div>
            ))}
        </div>
    );
}

interface PlotPoint {
    name: string;
    userAverage: number | null;
    max: number | null;
    [groupKey: string]: number | null | string;
}

function constructDataPlot(
    data: UserGroupGraphData,
    userAverage: PlottingData,
    xAxis: Date[],
): PlotPoint[] {
    return xAxis.map((date, i) => {
        const point: PlotPoint = {
            name: date.toLocaleDateString("fr-FR", {day:"2-digit", month: "short", year: "2-digit"}),
            userAverage: userAverage.data[i] ?? null,
            max: data.max.data[i] ?? null,
        };
        // Add one key per group average (e.g. "avg_P1", "avg_SC3", …)
        data.groupAverages.forEach((group) => {
            point[`avg_${group.label}`] = group.data[i] ?? null;
        });
        return point;
    });
}

function StatsGraph({graphData, type}: StatsGraphProps) {
    if (!graphData) return null;
    const data: UserGroupGraphData | null = graphData[type];
    if (!data) return null;

    const plotData = constructDataPlot(data, graphData.userAverage, graphData.xAxis);

    // Latest user average to show as a reference line label
    const latestUserAvg = [...(graphData.userAverage.data)].reverse().find(v => v != null);

    // Compute dynamic Y domain: 5% padding around [min, max] of all values, clamped to [0, 20]
    const allValues: number[] = plotData.flatMap(point =>
        Object.entries(point)
            .filter(([k]) => k !== "name")
            .map(([, v]) => v)
            .filter((v): v is number => typeof v === "number")
    );
    const dataMin = allValues.length ? Math.min(...allValues) : 0;
    const dataMax = allValues.length ? Math.max(...allValues) : 20;
    const range = dataMax - dataMin || 1;
    const padding = range * 0.05;
    const yMin = Math.max(0,  Math.floor(dataMin - padding));
    const yMax = Math.min(20, Math.ceil(dataMax  + padding));

    // Generate readable ticks within the dynamic range
    const tickStep = yMax - yMin <= 4 ? 1 : yMax - yMin <= 8 ? 2 : 5;
    const yTicks: number[] = [];
    for (let t = Math.ceil(yMin / tickStep) * tickStep; t <= yMax; t += tickStep) {
        yTicks.push(t);
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-base font-semibold tracking-tight">
                    Évolution des moyennes
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Ta progression comparée aux groupes et au meilleur étudiant
                </p>
            </CardHeader>
            <CardContent className="pt-4 pr-2">
                <ResponsiveContainer width="100%" aspect={1.9}>
                    <ComposedChart data={plotData} margin={{top: 8, right: 16, bottom: 0, left: 0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>

                        <XAxis
                            dataKey="name"
                            tick={{fontSize: 11, fill: "hsl(var(--muted-foreground))"}}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[yMin, yMax]}
                            ticks={yTicks}
                            tick={{fontSize: 11, fill: "hsl(var(--muted-foreground))"}}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                        />

                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend
                            wrapperStyle={{fontSize: 11, paddingTop: 12}}
                            iconType="circle"
                            iconSize={8}
                        />

                        {/* Reference line at user's latest average */}
                        {latestUserAvg != null && (
                            <ReferenceLine
                                y={latestUserAvg}
                                stroke={USER_AVG_COLOR}
                                strokeDasharray="4 4"
                                strokeOpacity={0.4}
                            />
                        )}

                        {/* Group averages — one line per group */}
                        {data.groupAverages.map((group, idx) => (
                            <Line
                                key={group.label}
                                type="monotone"
                                dataKey={`avg_${group.label}`}
                                name={`Moy. ${group.label}`}
                                stroke={GROUP_COLORS[idx % GROUP_COLORS.length]}
                                strokeWidth={1.5}
                                dot={false}
                                strokeOpacity={0.7}
                                connectNulls
                            />
                        ))}

                        {/* Max line */}
                        <Line
                            type="monotone"
                            dataKey="max"
                            name="Meilleur"
                            stroke={MAX_COLOR}
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray="5 3"
                            strokeOpacity={0.8}
                            connectNulls
                        />

                        {/* User average — hero line, always on top */}
                        <Line
                            type="monotone"
                            dataKey="userAverage"
                            name="Ta moyenne"
                            stroke={USER_AVG_COLOR}
                            strokeWidth={2.5}
                            dot={{r: 3, fill: USER_AVG_COLOR, strokeWidth: 0}}
                            activeDot={{r: 5}}
                            connectNulls
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function SkeletonStatsGraph() {
    return (
        <Card>
            <CardHeader className="pb-2 border-b border-border/50">
                <div className="h-4 bg-muted/50 rounded w-1/3 animate-pulse"/>
                <div className="h-3 bg-muted/30 rounded w-1/2 animate-pulse mt-1"/>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="w-full rounded-md bg-muted/30 animate-pulse" style={{aspectRatio: 1.9}}/>
            </CardContent>
        </Card>
    );
}

export default StatsGraph;