"use client";

import {useEffect} from "react";
import {useQueryState} from "nuqs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {UserSemestersFormated} from "@components/pages/StatisticsPage";

type StatisticsSemesterSelectorProps = {
    semesters: UserSemestersFormated[];
    selectedSemester: UserSemestersFormated | null;
}

// SemesterSelectorFallbackSkeleton component to show while loading semesters
export function StatisticsSemesterSelectorFallbackSkeleton() {
    return (
        <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded"/>
            <div className="h-8 w-40 bg-muted rounded"/>
        </div>
    );
}

// Component to select semester for statistics page
export function StatisticsSemesterSelector({semesters, selectedSemester}: StatisticsSemesterSelectorProps) {
    const [semesterId, setSemesterId] = useQueryState("semesterId", {
        defaultValue: "",
        shallow: false,
    })

    useEffect(() => {
        if (semesterId === "" || semesterId?.length === 0) {
            if (semesters.length > 1) {
                const dateNow = new Date();
                // Try to find the most recent semester that is not in the future
                const pastSemesters = semesters.filter(sem => {
                    const [startYear, endYear] = sem.academicYear.split("-").map(Number);
                    // Assuming semester 1 starts in September and semester 2 starts in February
                    const semesterStartDate = sem.semester === 1 ? new Date(startYear, 8, 1) : new Date(endYear, 1, 1);
                    return semesterStartDate <= dateNow;
                });
                if (pastSemesters.length > 0) {
                    setSemesterId(pastSemesters[0]._id).then();
                } else {
                    setSemesterId(semesters[0]._id).then();
                }
                setSemesterId(semesters.sort((a,b) => b.semester - a.semester)[0]._id).then();
            } else {
                setSemesterId(semesters[0]._id).then();
            }
        }
    }, [semesterId, semesters, setSemesterId]);

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-sm text-muted-foreground">Semestre :</span>
            <Select
                value={selectedSemester?._id}
                onValueChange={(id) => {
                    setSemesterId(id).then();
                }}
            >
                <SelectTrigger className="w-full sm:w-70 cursor-pointer">
                    <SelectValue placeholder="Sélectionner un semestre"/>
                </SelectTrigger>
                <SelectContent>
                    {semesters.map(sem => (
                        <SelectItem key={sem._id} value={sem._id} className={"cursor-pointer"}>
                            {sem.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}