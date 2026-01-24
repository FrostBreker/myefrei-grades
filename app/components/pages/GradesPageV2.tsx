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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { GraduationCap, Plus, BookOpen, Loader2, Edit } from "lucide-react";
import { UserSemester, AcademicProfile, AcademicPath, AcademicYearTemplate } from "@lib/grades/types";
import SemesterGradesEditor from "./SemesterGradesEditor";

interface TemplateOption {
    cursus: string;
    filiere: string;
    groupe: string;
    academicYear: string;
    hasS1: boolean;
    hasS2: boolean;
}

interface GradesPageProps {
    initialProfile: AcademicProfile;
    initialSemesters: UserSemester[];
    userEmail: string;
}

export default function GradesPageV2({ initialProfile, initialSemesters, userEmail }: GradesPageProps) {
    const [profile, setProfile] = useState<AcademicProfile>(initialProfile);
    const [semesters, setSemesters] = useState<UserSemester[]>(initialSemesters);
    const [activePath, setActivePath] = useState<AcademicPath | null>(
        initialProfile.paths.find((p: AcademicPath) => p.isActive) || initialProfile.paths[0] || null
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSemester, setEditingSemester] = useState<UserSemester | null>(null);

    // Template-based path selection
    const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedOption, setSelectedOption] = useState<TemplateOption | null>(null);

    useEffect(() => {
        if (dialogOpen) {
            loadAvailableTemplates();
        }
    }, [dialogOpen]);

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


    const loadAvailableTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const response = await fetch("/api/admin/year-templates");
            const data = await response.json();

            if (data.success) {
                // Convert year templates to options
                const options: TemplateOption[] = data.templates.map((template: AcademicYearTemplate) => ({
                    cursus: template.cursus,
                    filiere: template.filiere,
                    groupe: template.groupe,
                    academicYear: template.academicYear,
                    hasS1: template.semesters.some(s => s.semester === 1),
                    hasS2: template.semesters.some(s => s.semester === 2)
                }));

                setTemplateOptions(options);
            }
        } catch (error) {
            console.error("Error loading templates:", error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleAddPath = async () => {
        if (!selectedOption) {
            alert("Veuillez sélectionner un parcours");
            return;
        }

        try {
            const response = await fetch("/api/grades/paths", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cursus: selectedOption.cursus,
                    filiere: selectedOption.filiere,
                    groupe: selectedOption.groupe,
                    academicYear: selectedOption.academicYear !== "Non spécifié" ? selectedOption.academicYear : undefined,
                    setAsActive: true
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Nouveau parcours ajouté !");
                setDialogOpen(false);
                setSelectedOption(null);
                refreshData();
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error adding path:", error);
            alert("❌ Erreur lors de l'ajout du parcours");
        }
    };

    const handleSwitchPath = async (pathId: string) => {
        try {
            const response = await fetch("/api/grades/paths", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pathId })
            });

            const data = await response.json();

            if (data.success) {
                refreshData();
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                            <div>
                                <h1 className="text-2xl md:text-4xl font-bold">Mes Notes</h1>
                                <p className="text-sm md:text-base text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="default" className="w-full sm:w-auto">
                                    <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                                    Ajouter un parcours
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Ajouter un nouveau parcours</DialogTitle>
                                    <DialogDescription>
                                        Sélectionnez le parcours correspondant à votre nouvelle année
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {loadingTemplates ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                            <p className="text-muted-foreground">Chargement des parcours disponibles...</p>
                                        </div>
                                    ) : templateOptions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                Aucun parcours disponible. Contactez un administrateur.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {templateOptions.map((option, index) => (
                                                    <Card
                                                        key={index}
                                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                                            selectedOption === option
                                                                ? "border-2 border-primary bg-primary/5"
                                                                : "border-2 border-transparent"
                                                        }`}
                                                        onClick={() => setSelectedOption(option)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="secondary">{option.cursus}</Badge>
                                                                <Badge variant="secondary">{option.filiere}</Badge>
                                                                <Badge variant="outline">{option.groupe}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Année : {option.academicYear}
                                                            </p>
                                                            <div className="flex gap-2 mt-2">
                                                                {option.hasS1 ? (
                                                                    <Badge className="bg-green-500 text-xs">S1 ✓</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs text-muted-foreground">S1 ✕</Badge>
                                                                )}
                                                                {option.hasS2 ? (
                                                                    <Badge className="bg-blue-500 text-xs">S2 ✓</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs text-muted-foreground">S2 ✕</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                                {selectedOption === option && (
                                                                    <Badge className="ml-4">Sélectionné</Badge>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                            <div className="flex gap-3 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setDialogOpen(false);
                                                        setSelectedOption(null);
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Annuler
                                                </Button>
                                                <Button
                                                    onClick={handleAddPath}
                                                    disabled={!selectedOption}
                                                    className="flex-1"
                                                >
                                                    Ajouter ce parcours
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Path selector */}
                    <Card>
                        <CardContent className="p-3 md:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <Label className="text-sm whitespace-nowrap">Parcours actif :</Label>
                                <Select
                                    value={activePath?.id}
                                    onValueChange={handleSwitchPath}
                                >
                                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[300px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {profile.paths.map(path => (
                                            <SelectItem key={path.id} value={path.id}>
                                                {path.cursus} {path.filiere} {path.groupe} ({path.academicYear})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for each path */}
                <Tabs defaultValue={profile.paths[0]?.id} className="space-y-4 md:space-y-6">
                    <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                        <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full" style={{ gridTemplateColumns: `repeat(${profile.paths.length}, 1fr)` }}>
                            {profile.paths.map(path => (
                                <TabsTrigger key={path.id} value={path.id} className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4">
                                    <span className="hidden sm:inline">{path.filiere} {path.groupe}</span>
                                    <span className="sm:hidden">{path.filiere.slice(0, 4)}...</span>
                                    <Badge variant="outline" className="ml-1 md:ml-2 text-xs">{path.academicYear.split('-')[0]}</Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {semestersByPath.map(({ path, semesters: pathSemesters }) => {
                        const s1 = pathSemesters.find(s => s.semester === 1);
                        const s2 = pathSemesters.find(s => s.semester === 2);

                        return (
                            <TabsContent key={path.id} value={path.id} className="space-y-6">
                                {/* Always show S1 and S2 tabs */}
                                <Tabs defaultValue="s1" className="space-y-6">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="s1" className={"cursor-pointer"}>Semestre 1</TabsTrigger>
                                        <TabsTrigger value="s2" className={"cursor-pointer"}>Semestre 2</TabsTrigger>
                                    </TabsList>

                                    {/* Semester 1 Content */}
                                    <TabsContent value="s1">
                                        {s1 ? (
                                            <Card className="hover:shadow-lg transition-shadow">
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-lg">
                                                            {s1.name}
                                                        </CardTitle>
                                                        {s1.average !== null ? (
                                                            <Badge
                                                                variant={s1.average >= 10 ? "default" : "destructive"}
                                                                className="text-lg px-3 py-1"
                                                            >
                                                                {s1.average.toFixed(2)}/20
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-lg px-3 py-1">
                                                                -/20
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {/* Stats summary */}
                                                        <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b">
                                                            <div>
                                                                <div className="text-2xl font-bold">{s1.ues.length}</div>
                                                                <div className="text-xs text-muted-foreground">UEs</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold">{s1.totalECTS}</div>
                                                                <div className="text-xs text-muted-foreground">ECTS Total</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold">
                                                                    {s1.ectsObtained !== null ? s1.ectsObtained : "-"}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">ECTS Obtenus</div>
                                                            </div>
                                                        </div>

                                                        {/* Grades overview */}
                                                        {s1.ues.length > 0 && (
                                                            <div className="space-y-3">
                                                                {s1.ues.map((ue) => {
                                                                    const ueAvg = ue.average ?? null;
                                                                    return (
                                                                        <div key={ue.id} className="border rounded-lg p-2 md:p-3">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                                                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                                                    <Badge variant="outline" className="text-xs">{ue.code}</Badge>
                                                                                    <span className="font-medium text-xs md:text-sm">{ue.name}</span>
                                                                                    <Badge variant="secondary" className="text-xs">{ue.ects} ECTS</Badge>
                                                                                </div>
                                                                                {ueAvg !== null ? (
                                                                                    <Badge variant={ueAvg >= 10 ? "default" : "destructive"} className="self-end sm:self-auto">
                                                                                        {ueAvg.toFixed(2)}/20
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge variant="outline" className="self-end sm:self-auto">-/20</Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="pl-2 md:pl-4 space-y-1">
                                                                                {ue.modules.map((mod) => {
                                                                                    const modAvg = mod.average ?? null;
                                                                                    const gradesCount = mod.grades.filter(g => g.grade !== null).length;
                                                                                    const totalGrades = mod.grades.length;
                                                                                    return (
                                                                                        <div key={mod.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs md:text-sm py-1 border-b border-dashed last:border-0 gap-1">
                                                                                            <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                                                                <span className="text-muted-foreground">{mod.code}</span>
                                                                                                <span className="truncate max-w-[150px] md:max-w-none">{mod.name}</span>
                                                                                                <span className="text-xs text-muted-foreground">
                                                                                                    ({gradesCount}/{totalGrades})
                                                                                                </span>
                                                                                            </div>
                                                                                            {modAvg !== null ? (
                                                                                                <span className={`font-medium ${modAvg >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                    {modAvg.toFixed(2)}
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-muted-foreground">-</span>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {s1.locked && (
                                                            <Badge variant="outline" className="w-full justify-center">
                                                                🔒 Verrouillé
                                                            </Badge>
                                                        )}
                                                        <Button
                                                            onClick={() => setEditingSemester(s1)}
                                                            className="w-full  cursor-pointer"
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Gérer mes notes
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card className="border-2 border-dashed">
                                                <CardContent className="p-12 text-center">
                                                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                                    <h3 className="text-xl font-bold mb-2">📚 Semestre 1 non défini</h3>
                                                    <p className="text-muted-foreground">
                                                        Le semestre 1 n&apos;est pas encore disponible pour ce parcours.
                                                        <br />
                                                        Il sera automatiquement ajouté quand l&apos;administration le définira.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </TabsContent>

                                    {/* Semester 2 Content */}
                                    <TabsContent value="s2">
                                        {s2 ? (
                                            <Card className="hover:shadow-lg transition-shadow">
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-lg">
                                                            {s2.name}
                                                        </CardTitle>
                                                        {s2.average !== null ? (
                                                            <Badge
                                                                variant={s2.average >= 10 ? "default" : "destructive"}
                                                                className="text-lg px-3 py-1"
                                                            >
                                                                {s2.average.toFixed(2)}/20
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-lg px-3 py-1">
                                                                -/20
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {/* Stats summary */}
                                                        <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b">
                                                            <div>
                                                                <div className="text-2xl font-bold">{s2.ues.length}</div>
                                                                <div className="text-xs text-muted-foreground">UEs</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold">{s2.totalECTS}</div>
                                                                <div className="text-xs text-muted-foreground">ECTS Total</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold">
                                                                    {s2.ectsObtained !== null ? s2.ectsObtained : "-"}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">ECTS Obtenus</div>
                                                            </div>
                                                        </div>

                                                        {/* Grades overview */}
                                                        {s2.ues.length > 0 && (
                                                            <div className="space-y-3">
                                                                {s2.ues.map((ue) => {
                                                                    const ueAvg = ue.average ?? null;
                                                                    return (
                                                                        <div key={ue.id} className="border rounded-lg p-2 md:p-3">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                                                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                                                    <Badge variant="outline" className="text-xs">{ue.code}</Badge>
                                                                                    <span className="font-medium text-xs md:text-sm">{ue.name}</span>
                                                                                    <Badge variant="secondary" className="text-xs">{ue.ects} ECTS</Badge>
                                                                                </div>
                                                                                {ueAvg !== null ? (
                                                                                    <Badge variant={ueAvg >= 10 ? "default" : "destructive"} className="self-end sm:self-auto">
                                                                                        {ueAvg.toFixed(2)}/20
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge variant="outline" className="self-end sm:self-auto">-/20</Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="pl-2 md:pl-4 space-y-1">
                                                                                {ue.modules.map((mod) => {
                                                                                    const modAvg = mod.average ?? null;
                                                                                    const gradesCount = mod.grades.filter(g => g.grade !== null).length;
                                                                                    const totalGrades = mod.grades.length;
                                                                                    return (
                                                                                        <div key={mod.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs md:text-sm py-1 border-b border-dashed last:border-0 gap-1">
                                                                                            <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                                                                <span className="text-muted-foreground">{mod.code}</span>
                                                                                                <span className="truncate max-w-[150px] md:max-w-none">{mod.name}</span>
                                                                                                <span className="text-xs text-muted-foreground">
                                                                                                    ({gradesCount}/{totalGrades})
                                                                                                </span>
                                                                                            </div>
                                                                                            {modAvg !== null ? (
                                                                                                <span className={`font-medium ${modAvg >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                    {modAvg.toFixed(2)}
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-muted-foreground">-</span>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {s2.locked && (
                                                            <Badge variant="outline" className="w-full justify-center">
                                                                🔒 Verrouillé
                                                            </Badge>
                                                        )}
                                                        <Button
                                                            onClick={() => setEditingSemester(s2)}
                                                            className="w-full cursor-pointer"
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Gérer mes notes
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card className="border-2 border-dashed">
                                                <CardContent className="p-12 text-center">
                                                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                                    <h3 className="text-xl font-bold mb-2">📚 Semestre 2 non défini</h3>
                                                    <p className="text-muted-foreground">
                                                        Le semestre 2 n&apos;est pas encore disponible pour ce parcours.
                                                        <br />
                                                        Il sera automatiquement ajouté quand l&apos;administration le définira.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
        </div>
    );
}
