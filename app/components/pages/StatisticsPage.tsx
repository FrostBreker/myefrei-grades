"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    Trophy,
    Loader2,
    Target,
} from "lucide-react";
import { UserSemester, AcademicProfile } from "@lib/grades/types";

interface StatisticsPageProps {
    initialProfile: AcademicProfile;
    initialSemesters: UserSemester[];
}

interface AverageStats {
    average: number | null;
    rank: number | null;
    totalWithGrades: number;
    min: number | null;
    max: number | null;
    median: number | null;
}

interface ModuleStats {
    moduleId: string;
    moduleCode: string;
    moduleName: string;
    stats: AverageStats;
}

interface UEStats {
    ueId: string;
    ueCode: string;
    ueName: string;
    stats: AverageStats;
    modules: ModuleStats[];
}

interface GroupStats {
    name: string;
    totalUsers: number;
    averages: {
        global: AverageStats;
        byUE: UEStats[];
    };
}

interface StatsData {
    groupe: GroupStats;
    filiere: GroupStats;
    cursus: GroupStats;
}

// Component to display rank with medal
function RankDisplay({ rank, total }: { rank: number | null; total: number }) {
    if (rank === null || total === 0) {
        return <span className="text-muted-foreground">-</span>;
    }

    const percentage = (rank / total) * 100;
    let color = "text-muted-foreground";
    let icon = null;

    if (rank === 1) {
        color = "text-yellow-500";
        icon = <Trophy className="h-4 w-4 inline mr-1" />;
    } else if (rank === 2) {
        color = "text-gray-400";
        icon = <Trophy className="h-4 w-4 inline mr-1" />;
    } else if (rank === 3) {
        color = "text-amber-600";
        icon = <Trophy className="h-4 w-4 inline mr-1" />;
    } else if (percentage <= 10) {
        color = "text-green-500";
    } else if (percentage <= 25) {
        color = "text-blue-500";
    } else if (percentage > 75) {
        color = "text-red-500";
    }

    return (
        <span className={`font-bold ${color}`}>
            {icon}
            {rank}/{total}
        </span>
    );
}

// Component to show comparison with group average
function ComparisonIndicator({ userAvg, groupAvg }: { userAvg: number | null; groupAvg: number | null }) {
    if (userAvg === null || groupAvg === null) {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    const diff = userAvg - groupAvg;
    const absDiff = Math.abs(diff).toFixed(2);

    if (diff > 0.5) {
        return (
            <span className="flex items-center text-green-500 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{absDiff}
            </span>
        );
    } else if (diff < -0.5) {
        return (
            <span className="flex items-center text-red-500 text-xs">
                <TrendingDown className="h-3 w-3 mr-1" />
                -{absDiff}
            </span>
        );
    } else {
        return (
            <span className="flex items-center text-muted-foreground text-xs">
                <Minus className="h-3 w-3 mr-1" />
                ≈
            </span>
        );
    }
}

// Stats card for a specific group level
function StatsCard({ stats, userAverage, level }: { stats: GroupStats; userAverage: number | null; level: string }) {
    const levelLabels: Record<string, string> = {
        groupe: "Groupe",
        filiere: "Filière",
        cursus: "Cursus"
    };

    const levelColors: Record<string, string> = {
        groupe: "bg-blue-500",
        filiere: "bg-purple-500",
        cursus: "bg-orange-500"
    };

    return (
        <div className="space-y-4">
            {/* Global stats header */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Badge className={levelColors[level]}>{levelLabels[level]}</Badge>
                            <span>{stats.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {stats.totalUsers} étudiants
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {/* User rank */}
                        <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Ton classement</div>
                            <div className="text-lg md:text-xl font-bold">
                                <RankDisplay rank={stats.averages.global.rank} total={stats.averages.global.totalWithGrades} />
                            </div>
                        </div>

                        {/* Group average */}
                        <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Moy. groupe</div>
                            <div className="text-lg md:text-xl font-bold">
                                {stats.averages.global.average?.toFixed(2) ?? "-"}
                            </div>
                        </div>

                        {/* User vs group */}
                        <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Ta moyenne</div>
                            <div className="flex items-center justify-center gap-1 md:gap-2">
                                <span className="text-lg md:text-xl font-bold">
                                    {userAverage?.toFixed(2) ?? "-"}
                                </span>
                                <ComparisonIndicator userAvg={userAverage} groupAvg={stats.averages.global.average} />
                            </div>
                        </div>

                        {/* Min/Max */}
                        <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Max</div>
                            <div className="text-lg md:text-xl font-bold">
                                <span className="text-green-500">{stats.averages.global.max?.toFixed(2) ?? "-"}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* UE details */}
            {stats.averages.byUE.length > 0 && level !== "cursus" && (
                <Accordion type="multiple" className="space-y-2">
                    {stats.averages.byUE.map((ue) => (
                        <AccordionItem key={ue.ueId} value={ue.ueId} className="border rounded-lg">
                            <AccordionTrigger className="px-3 md:px-4 hover:no-underline cursor-pointer">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mr-2 md:mr-4 gap-2">
                                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                        <Badge variant="outline" className="text-xs">{ue.ueCode}</Badge>
                                        <span className="font-medium text-xs md:text-sm">{ue.ueName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm self-end sm:self-auto">
                                        <span className="text-muted-foreground">
                                            Moy: {ue.stats.average?.toFixed(2) ?? "-"}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Max: {ue.stats.max?.toFixed(2) ?? "-"}
                                        </span>
                                        <RankDisplay rank={ue.stats.rank} total={ue.stats.totalWithGrades} />
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 md:px-4 pb-4">
                                <div className="space-y-2">
                                    {ue.modules.map((mod) => (
                                        <div
                                            key={mod.moduleId}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-muted/30 rounded text-xs md:text-sm gap-2"
                                        >
                                            <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                <span className="text-muted-foreground">{mod.moduleCode}</span>
                                                <span className="truncate max-w-[150px] md:max-w-none">{mod.moduleName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-4 self-end sm:self-auto">
                                                <span className="text-muted-foreground">
                                                    Moy: {mod.stats.average?.toFixed(2) ?? "-"}
                                                </span>
                                                <span className="text-muted-foreground hidden sm:inline">
                                                    Max: {mod.stats.max?.toFixed(2) ?? "-"}
                                                </span>
                                                <RankDisplay rank={mod.stats.rank} total={mod.stats.totalWithGrades} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}

export default function StatisticsPage({ initialSemesters }: StatisticsPageProps) {
    const [loadingStats, setLoadingStats] = useState(false);
    const [semesters] = useState<UserSemester[]>(initialSemesters);
    const [selectedSemester, setSelectedSemester] = useState<UserSemester | null>(initialSemesters[0] || null);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (selectedSemester) {
            loadStats(selectedSemester._id);
        }
    }, [selectedSemester]);

    const loadStats = async (semesterId: string) => {
        setLoadingStats(true);
        setError(null);
        setStats(null);

        try {
            const response = await fetch(`/api/grades/stats?semesterId=${semesterId}`);
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            } else {
                setError(data.error || "Erreur lors du chargement des statistiques");
            }
        } catch (err) {
            console.error("Error loading stats:", err);
            setError("Erreur de connexion");
        } finally {
            setLoadingStats(false);
        }
    };


    return (
        <div className="min-h-screen bg-background py-4 md:py-8">
            <div className="px-3 md:px-4 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                            Statistiques
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Compare tes résultats avec les autres étudiants
                        </p>
                    </div>

                    {/* Semester selector */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="text-sm text-muted-foreground">Semestre :</span>
                        <Select
                            value={selectedSemester?._id}
                            onValueChange={(id) => {
                                const sem = semesters.find(s => s._id === id);
                                if (sem) setSelectedSemester(sem);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[280px] cursor-pointer">
                                <SelectValue placeholder="Sélectionner un semestre" />
                            </SelectTrigger>
                            <SelectContent>
                                {semesters.map(sem => (
                                    <SelectItem key={sem._id} value={sem._id}>
                                        {sem.name} - {sem.filiere} {sem.groupe} ({sem.academicYear})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats content */}
                {loadingStats ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p className="text-muted-foreground">Calcul des statistiques...</p>
                        </div>
                    </div>
                ) : error ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-bold mb-2">Statistiques indisponibles</h3>
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <Button variant="outline" onClick={() => selectedSemester && loadStats(selectedSemester._id)}>
                                Réessayer
                            </Button>
                        </CardContent>
                    </Card>
                ) : stats && selectedSemester ? (
                    <>
                        {/* Summary card */}
                        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                            <CardContent className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/20 rounded-full">
                                            <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                                        </div>
                                        <div>
                                            <div className="text-xs md:text-sm text-muted-foreground">Ta moyenne - {selectedSemester.name}</div>
                                            <div className="text-2xl md:text-3xl font-bold">
                                                {selectedSemester.average?.toFixed(2) ?? "-"}/20
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 md:gap-6 text-center">
                                        <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Groupe</div>
                                            <div className="font-bold text-blue-500 text-sm md:text-base">
                                                #{stats.groupe.averages.global.rank ?? "-"}/{stats.groupe.totalUsers}
                                            </div>
                                        </div>
                                        <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Filière</div>
                                            <div className="font-bold text-purple-500 text-sm md:text-base">
                                                #{stats.filiere.averages.global.rank ?? "-"}/{stats.filiere.totalUsers}
                                            </div>
                                        </div>
                                        <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Cursus</div>
                                            <div className="font-bold text-orange-500 text-sm md:text-base">
                                                #{stats.cursus.averages.global.rank ?? "-"}/{stats.cursus.totalUsers}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs for each level */}
                        <Tabs defaultValue="groupe" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="groupe" className="text-xs md:text-sm cursor-pointer">
                                    <span className="hidden sm:inline">Groupe</span>
                                    <span className="sm:hidden">Grp</span>
                                    <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{stats.groupe.totalUsers}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="filiere" className="text-xs md:text-sm cursor-pointer">
                                    <span className="hidden sm:inline">Filière</span>
                                    <span className="sm:hidden">Fil</span>
                                    <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{stats.filiere.totalUsers}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="cursus" className="text-xs md:text-sm cursor-pointer">
                                    Cursus
                                    <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{stats.cursus.totalUsers}</Badge>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="groupe">
                                <StatsCard stats={stats.groupe} userAverage={selectedSemester.average} level="groupe" />
                            </TabsContent>

                            <TabsContent value="filiere">
                                <StatsCard stats={stats.filiere} userAverage={selectedSemester.average} level="filiere" />
                            </TabsContent>

                            <TabsContent value="cursus">
                                <StatsCard stats={stats.cursus} userAverage={selectedSemester.average} level="cursus" />
                            </TabsContent>
                        </Tabs>
                    </>
                ) : null}
            </div>
        </div>
    );
}
