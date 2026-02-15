import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {Rank} from "@lib/stats/types";
import {TrendIndicator} from "@components/statistics/ComparisonIndicator";


const rankStyles: Record<number, string> = {
    1: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)]",
    2: "bg-gradient-to-r from-zinc-300 to-zinc-400 text-black shadow-[0_0_16px_rgba(161,161,170,0.4)]",
    3: "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-[0_0_16px_rgba(180,83,9,0.4)]",
}

interface LeaderboardProps {
    data: Rank[];
    isUser?: boolean;
}

// Leaderboard show group rankings
export function Leaderboard({data, isUser = false}: LeaderboardProps) {
    return (
        <Card className="w-full border-muted/40 bg-background/80 backdrop-blur">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    🏆 Classement {isUser ? "des étudiants" : "par groupe"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-muted/40">
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Groupe</TableHead>
                            <TableHead className="text-right">Moyenne</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.map((item) => {
                            const name = item.name.split("/-/")[0];
                            const group = item.name.split("/-/")[1] || "N/A";
                            const shouldBlur = isUser && name === "John Doe";

                            return (
                                <TableRow
                                    key={item.rank.current}
                                    className="transition-colors hover:bg-muted/40"
                                >
                                    {/* Rank */}
                                    <TableCell>
                                        <div
                                            className={`
                        flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                        ${rankStyles[item.rank.current] ?? "bg-muted text-muted-foreground"}
                      `}
                                        >
                                            {item.rank.current}
                                        </div>
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {
                                                shouldBlur ? (
                                                    <a href={"/settings"} className={shouldBlur ? "blur-xs select-none cursor-help" : ""} title={shouldBlur ? "Vous pouvez afficher votre nom dans les paramètres" : ""}>
                                                        {name}
                                                    </a>
                                                ) : (
                                                    <span>{name}</span>
                                                )
                                            }

                                            {
                                                isUser && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {group}
                                                    </Badge>
                                                )
                                            }

                                            <TrendIndicator value={item.rank.raw}/>
                                        </div>
                                    </TableCell>

                                    {/* Average */}
                                    <TableCell className="text-right font-mono text-sm">
                                        <span>{item.average.current.toFixed(2)}</span>
                                        <TrendIndicator value={item.average.raw}/>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}