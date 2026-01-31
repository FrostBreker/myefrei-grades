"use client";

import {useState, useEffect} from "react";
import {Card, CardContent} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {GraduationCap} from "lucide-react";
import {UserSemester, AcademicProfile, AcademicPath} from "@lib/grades/types";
import SemesterGradesEditor from "./SemesterGradesEditor";
import GradeSemesterTab from "@components/grades/GradeSemesterTab";
import AddAcademicPath from "@components/dialogs/AddAcademicPath";
import ChangeAcademicPath from "@components/dialogs/ChangeAcademicPath";


interface GradesPageProps {
    initialProfile: AcademicProfile;
    initialSemesters: UserSemester[];
    userEmail: string;
}

export default function GradesPage({initialProfile, initialSemesters, userEmail}: GradesPageProps) {
    const [profile, setProfile] = useState<AcademicProfile>(initialProfile);
    const [semesters, setSemesters] = useState<UserSemester[]>(initialSemesters);
    const [activePath, setActivePath] = useState<AcademicPath | null>(
        initialProfile.paths.find((p: AcademicPath) => p.isActive) || initialProfile.paths[0] || null
    );

    const [editingSemester, setEditingSemester] = useState<UserSemester | null>(null);

    // State for available branches and selected branch per semester
    const [semesterBranches, setSemesterBranches] = useState<Record<string, string[]>>({}); // { semesterId: [branches] }
    const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({}); // { semesterId: branch }

    // Function to refresh data after mutations
    const refreshData = async () => {
        try {
            const [profileRes, semestersRes] = await Promise.all([
                fetch("/api/grades/paths"),
                fetch("/api/grades/semesters")
            ]);

            const profileData = await profileRes.json();
            const semestersData = await semestersRes.json();

            if (profileData.success && profileData.profile) {
                setProfile(profileData.profile);
                const active = profileData.profile.paths.find((p: AcademicPath) => p.isActive);
                setActivePath(active || profileData.profile.paths[0]);
            }

            if (semestersData.success) {
                setSemesters(semestersData.semesters);
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    };

    const handleSwitchPath = async (pathId: string) => {
        try {
            const response = await fetch("/api/grades/paths", {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({pathId})
            });

            const data = await response.json();

            if (data.success) {
                await refreshData();
            }
        } catch (error) {
            console.error("Error switching path:", error);
        }
    };


    const handleSemesterUpdate = (updatedSemester: UserSemester) => {
        setSemesters(prev =>
            prev.map(s => s._id === updatedSemester._id ? updatedSemester : s)
        );
    };


    // Group semesters by path
    const semestersByPath = profile.paths.map(path => {
        const pathSemesters = semesters.filter(
            s => s.cursus === path.cursus &&
                s.filiere === path.filiere &&
                s.groupe === path.groupe &&
                s.academicYear === path.academicYear
        );
        return {
            path,
            semesters: pathSemesters
        };
    });

    // Fetch branches for each semester when semesters or activePath change
    useEffect(() => {
        const fetchBranches = async () => {
            const newSemesterBranches: Record<string, string[]> = {};
            const newSelectedBranches: Record<string, string> = {};
            for (const sem of semesters) {
                if (!sem) continue;
                try {
                    const res = await fetch(`/api/grades/year-template-by-path?cursus=${sem.cursus}&filiere=${sem.filiere}&groupe=${sem.groupe}&academicYear=${sem.academicYear}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.template && Array.isArray(data.template.branches) && data.template.branches.length > 0) {
                            newSemesterBranches[sem._id] = data.template.branches;
                            newSelectedBranches[sem._id] = sem.branch || "";
                        }
                    }
                } catch (e) { /* ignore */ }
            }
            setSemesterBranches(newSemesterBranches);
            setSelectedBranches(newSelectedBranches);
        };
        fetchBranches();
    }, [semesters, activePath]);

    // Handler for branch change
    const handleBranchChange = async (semesterId: string, branch: string) => {
        setSelectedBranches(prev => ({ ...prev, [semesterId]: branch }));
        // Update on server
        try {
            await fetch(`/api/grades/semesters`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ semesterId, branch })
            });
            await refreshData();
        } catch (e) {
            console.error("Error updating branch:", e);
        }
    };

    // Show semester editor if editing
    if (editingSemester) {
        return (
            <div className="min-h-screen bg-background py-8">
                <div className="px-4 max-w-7xl mx-auto">
                    <SemesterGradesEditor
                        semester={editingSemester}
                        onBack={() => setEditingSemester(null)}
                        onUpdate={handleSemesterUpdate}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-4 md:py-8">
            <div className="px-3 md:px-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    {/*Add Path*/}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary"/>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-bold">Mes Notes</h1>
                                <p className="text-sm md:text-base text-muted-foreground truncate max-w-50 sm:max-w-none">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                        <AddAcademicPath onPathAdded={refreshData} disabled={true}/>
                    </div>

                    {/* Path selector */}
                    <Card>
                        <CardContent className="p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <Label className="text-sm whitespace-nowrap">Parcours actif :</Label>
                                <Select
                                    value={activePath?.id}
                                    onValueChange={handleSwitchPath}
                                >
                                    <SelectTrigger className="w-full sm:w-auto sm:min-w-75 cursor-pointer">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {profile.paths.map(path => (
                                            <SelectItem key={path.id} value={path.id} className={"cursor-pointer"}>
                                                {path.cursus} {path.filiere} {path.groupe} ({path.academicYear})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/*    Change academic Path*/}
                            <ChangeAcademicPath activePath={activePath} refreshData={refreshData} disabled={false}/>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for each path */}
                <Tabs defaultValue={profile.paths[0]?.id} className="space-y-4 md:space-y-6">
                    {semestersByPath.map(({path, semesters: pathSemesters}) => {
                        const s1: UserSemester | undefined = pathSemesters.find(s => s.semester === 1);
                        const s2: UserSemester | undefined = pathSemesters.find(s => s.semester === 2);

                        return (
                            <TabsContent key={path.id} value={path.id} className="space-y-6">
                                {/* Always show S1 and S2 tabs */}
                                <Tabs defaultValue="s1" className="space-y-6">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="s1" className={"cursor-pointer"}>Semestre 1</TabsTrigger>
                                        <TabsTrigger value="s2" className={"cursor-pointer"}>Semestre 2</TabsTrigger>
                                    </TabsList>

                                    {/* Semester 1 Content */}
                                    <GradeSemesterTab
                                        semester={s1}
                                        semNumber={1}
                                        setEditingSemester={setEditingSemester}
                                        branches={s1 ? semesterBranches[s1._id] : []}
                                        selectedBranch={s1 ? selectedBranches[s1._id] : ""}
                                        onBranchChange={s1 ? (branch) => handleBranchChange(s1._id, branch) : undefined}
                                    />

                                    {/* Semester 2 Content */}
                                    <GradeSemesterTab
                                        semester={s2}
                                        semNumber={2}
                                        setEditingSemester={setEditingSemester}
                                        branches={s2 ? semesterBranches[s2._id] : []}
                                        selectedBranch={s2 ? selectedBranches[s2._id] : ""}
                                        onBranchChange={s2 ? (branch) => handleBranchChange(s2._id, branch) : undefined}
                                    />
                                </Tabs>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
        </div>
    );
}
