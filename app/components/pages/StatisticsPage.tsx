"use server";

import {Fragment, Suspense} from "react";
import {BarChart3, Target} from "lucide-react";
import {StatisticsSemesterSelector, StatisticsSemesterSelectorFallbackSkeleton} from "@components/statistics/SemesterSelector";
import {redirect} from "next/navigation";
import {UserStats} from "@lib/stats/types";
import {UserDB} from "@lib/user/types";
import {GetGlobalStatistics} from "@lib/stats/global_statistics";
import {getUserSemesters} from "@lib/grades/semesterService";
import {Module, UE, UserSemester} from "@lib/grades/types";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {StatsCard} from "@components/statistics/StatsCard";
import {TrendIndicator} from "@components/statistics/ComparisonIndicator";
import {UEList} from "@components/statistics/ModulesList";

export type UserSemestersFormated = {
    _id: string;
    name: string;
    semester: number;
    academicYear: string;
}
// Format semesters for dropdown selector with readable names (e.g. "Semestre 1 - P1 PMP (2023-2024)")
const formattedSemesters = (semesters: UserSemester[]): UserSemestersFormated[] => {
    return semesters.map(sem => ({
        _id: sem._id.toString(),
        name: `${sem.name} - ${sem.filiere} ${sem.groupe} (${sem.academicYear})`,
        semester: sem.semester,
        academicYear: sem.academicYear,
    }));
}

// Retrieve UEs for a given semester
function getUEs(semester: UserSemester): { ues: UE[] } {
    return {
        ues: semester.ues,
    }
}

// Content to show when stats are unavailable (e.g. semester not supported or error loading stats)
function UnAvailableStatsContent() {
    return (
        <Card>
            <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground"/>
                <h3 className="text-lg font-bold mb-2">Statistiques indisponibles</h3>
                <p className="text-muted-foreground mb-4">Ce semestre n&apos;est pas encore pris en charge ou il y a eu une erreur lors du chargement des statistiques.</p>
                <Link href={"/grades"} className={"cursor-pointer"}>
                    <Button className={"cursor-pointer"} variant="outline">Retour à mes notes</Button>
                </Link>
            </CardContent>
        </Card>
    );
}

interface StatisticsPageProps {
    semesterId: string;
    user: UserDB;
}

// Main page component for statistics, server-side rendered to fetch user semesters and stats before rendering
export default async function StatisticsPage({semesterId, user}: StatisticsPageProps) {
    // Get semesters server-side
    const userSemesters: UserSemester[] = await getUserSemesters(user._id.toString());
    const semesters: UserSemestersFormated[] = formattedSemesters(userSemesters);
    // If no semesters, redirect to setup/grades
    if (semesters.length === 0) {
        redirect("/grades");
    }

    // Determine which semester to show stats for based on query param, or default to most recent semester
    let currentSemester: UserSemestersFormated;
    let ues: UE[] = [];
    if (semesterId) {
        const foundSemester = semesters.find(sem => sem._id.toString() === semesterId);
        if (foundSemester) {
            currentSemester = foundSemester;
            const originalSemester = userSemesters.find(sem => sem._id.toString() === semesterId);
            if (originalSemester) {
                const data = getUEs(originalSemester);
                ues = data.ues;
            }
        } else {
            redirect("/grades");
        }
    } else {
        // Find the most recent semester (highest semester number) to show stats for by default
        currentSemester = semesters.sort((a, b) => b.semester - a.semester)[0];
    }

    // Fetch stats for the current semester
    const stats: UserStats | null = await GetGlobalStatistics({
        userId: user._id,
        semester: currentSemester.semester,
        academicYear: currentSemester.academicYear,
    });

    return (
        <div className="min-h-screen bg-background py-4 md:py-8">
            <div className="px-3 md:px-4 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-primary"/>
                            Statistiques
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Compare tes résultats avec les autres étudiants
                        </p>
                    </div>

                    {/* Semester selector */}
                    <Suspense fallback={<StatisticsSemesterSelectorFallbackSkeleton/>}>
                        <StatisticsSemesterSelector semesters={semesters} selectedSemester={currentSemester}/>
                    </Suspense>
                </div>

                {/* Stats content */}
                <Suspense fallback={<p>Loading</p>}>
                    {!stats || !stats.semester ? <UnAvailableStatsContent/> : <StatsContent stats={stats} ues={ues} semesterId={semesterId}/>}
                </Suspense>
            </div>
        </div>
    );
}

// Component to display the main stats content with summary card and tabs for each level (group, specialty, branch, overall)
function StatsContent({stats, ues, semesterId}: { stats: UserStats, ues: UE[], semesterId: string }) {
    const currentUserAverage = stats.overall?.userAverage?.current ?? 0;
    const {branch, group, spe, overall} = stats;
    return (
        <Fragment>
            {/* Summary card */}
            <Card className="bg-linear-to-r from-primary/10 to-primary/5">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/*User Average*/}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-full">
                                <Target className="h-6 w-6 md:h-8 md:w-8 text-primary"/>
                            </div>
                            <div>
                                <div className="text-xs md:text-sm text-muted-foreground">Ta moyenne</div>
                                <div className="text-2xl md:text-3xl font-bold">
                                    {currentUserAverage.toFixed(2) ?? "-"}/20
                                    <TrendIndicator value={stats.overall?.userAverage?.raw ?? 0}/>
                                </div>
                            </div>
                        </div>
                        {/*User Ranks in different groups*/}
                        <div className="grid grid-cols-3 gap-3 md:gap-6 text-center">
                            <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Groupe</div>
                                <div className="font-bold text-green-500 text-sm md:text-base">
                                    #{branch?.studentRank?.current ?? (group?.studentRank?.current ?? "-")}/{branch?.numberOfStudents ?? (group?.numberOfStudents ?? "-")}
                                </div>
                            </div>
                            <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Spécialité</div>
                                <div className="font-bold text-blue-500 text-sm md:text-base">
                                    #{group?.studentRank?.current ?? "-"}/{group?.numberOfStudents ?? "-"}
                                </div>
                            </div>
                            <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Filière</div>
                                <div className="font-bold text-purple-500 text-sm md:text-base">
                                    #{spe?.studentRank?.current ?? "-"}/{spe?.numberOfStudents ?? "-"}
                                </div>
                            </div>
                            <div className="p-2 md:p-3 bg-background/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Cursus</div>
                                <div className="font-bold text-orange-500 text-sm md:text-base">
                                    #{overall?.studentRank?.current ?? "-"}/{overall?.numberOfStudents ?? "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for each level */}
            <Tabs defaultValue="branch" className="space-y-4">
                <TabsList className={`grid w-full ${branch?.numberOfStudents ? "min-h-24 grid-cols-2" : "min-h-10 grid-cols-3"} sm:min-h-10 ${branch?.numberOfStudents ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
                    {branch?.numberOfStudents && (<TabsTrigger value="branch" className="text-xs md:text-sm cursor-pointer">
                        <span className="hidden sm:inline">Groupe</span>
                        <span className="sm:hidden">Grp</span>
                        <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{branch?.numberOfStudents ?? group?.numberOfStudents}</Badge>
                    </TabsTrigger>)}
                    <TabsTrigger value="spe" className="text-xs md:text-sm cursor-pointer">
                        <span className="hidden sm:inline">Spécialité</span>
                        <span className="sm:hidden">Spé</span>
                        <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{group?.numberOfStudents}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="filiere" className="text-xs md:text-sm cursor-pointer">
                        <span className="hidden sm:inline">Filière</span>
                        <span className="sm:hidden">Fil</span>
                        <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{spe?.numberOfStudents}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="cursus" className="text-xs md:text-sm cursor-pointer">
                        <span className="hidden sm:inline">Cursus</span>
                        <span className="sm:hidden">Cur</span>
                        <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{overall?.numberOfStudents}</Badge>
                    </TabsTrigger>
                </TabsList>

                {branch?.numberOfStudents && (<TabsContent value="branch">
                    <StatsCard stats={branch ?? group} level="branch"/>
                    <UEList ues={ues} semesterId={semesterId}/>
                </TabsContent>)}

                <TabsContent value="spe">
                    <StatsCard stats={group} level="spe"/>
                    <UEList ues={ues} semesterId={semesterId}/>
                </TabsContent>

                <TabsContent value="filiere">
                    <StatsCard stats={spe} level="filiere"/>
                    <UEList ues={ues} semesterId={semesterId}/>
                </TabsContent>

                <TabsContent value="cursus">
                    <StatsCard stats={overall} level="cursus"/>
                </TabsContent>
            </Tabs>
        </Fragment>
    )
}
