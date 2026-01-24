"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Loader2, BookOpen, Calculator } from "lucide-react";
import { UserSemester, UE, Module, GradeEntry } from "@lib/grades/types";

interface SemesterGradesEditorProps {
    semester: UserSemester;
    onBack: () => void;
    onUpdate: (semester: UserSemester) => void;
}

// Helper to get grade type label
const getGradeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
        TP: "Travaux Pratiques",
        TD: "Travaux Dirigés",
        PRJ: "Projet",
        DE: "Devoir sur table",
        CC: "Contrôle Continu",
        CO: "Contrôle Oral",
        CE: "Contrôle Écrit",
        TOEIC: "TOEIC",
        AUTRE: "Autre"
    };
    return labels[type] || type;
};

// Calculate module average
const calculateModuleAverage = (grades: GradeEntry[]): number | null => {
    let totalPoints = 0;
    let totalCoef = 0;

    for (const grade of grades) {
        if (grade.grade !== null) {
            const normalized = (grade.grade / grade.maxGrade) * 20;
            totalPoints += normalized * grade.coefficient;
            totalCoef += grade.coefficient;
        }
    }

    if (totalCoef === 0) return null;
    return Math.round((totalPoints / totalCoef) * 100) / 100;
};

// Calculate UE average
const calculateUEAverage = (modules: Module[]): number | null => {
    let totalPoints = 0;
    let totalCoef = 0;

    for (const mod of modules) {
        const avg = calculateModuleAverage(mod.grades);
        if (avg !== null) {
            totalPoints += avg * mod.coefficient;
            totalCoef += mod.coefficient;
        }
    }

    if (totalCoef === 0) return null;
    return Math.round((totalPoints / totalCoef) * 100) / 100;
};

// Calculate semester average
const calculateSemesterAverage = (ues: UE[]): number | null => {
    let totalPoints = 0;
    let totalCoef = 0;

    for (const ue of ues) {
        const avg = calculateUEAverage(ue.modules);
        if (avg !== null) {
            totalPoints += avg * ue.coefficient;
            totalCoef += ue.coefficient;
        }
    }

    if (totalCoef === 0) return null;
    return Math.round((totalPoints / totalCoef) * 100) / 100;
};

export default function SemesterGradesEditor({ semester, onBack, onUpdate }: SemesterGradesEditorProps) {
    const [ues, setUes] = useState<UE[]>(semester.ues);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Recalculate averages when grades change
    useEffect(() => {
        const updatedUes = ues.map(ue => ({
            ...ue,
            modules: ue.modules.map(mod => ({
                ...mod,
                average: calculateModuleAverage(mod.grades)
            })),
            average: calculateUEAverage(ue.modules)
        }));

        // Only update if averages changed
        const hasAvgChanges = JSON.stringify(updatedUes) !== JSON.stringify(ues);
        if (hasAvgChanges) {
            setUes(updatedUes);
        }
    }, [ues]);

    const handleGradeChange = (ueIndex: number, moduleIndex: number, gradeIndex: number, value: string) => {
        const newUes = [...ues];
        const grade = newUes[ueIndex].modules[moduleIndex].grades[gradeIndex];

        // Parse value - allow empty for null
        const numValue = value === "" ? null : parseFloat(value);

        // Validate
        if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > grade.maxGrade)) {
            return;
        }

        grade.grade = numValue;

        // Recalculate averages
        newUes[ueIndex].modules[moduleIndex].average = calculateModuleAverage(newUes[ueIndex].modules[moduleIndex].grades);
        newUes[ueIndex].average = calculateUEAverage(newUes[ueIndex].modules);

        setUes(newUes);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/grades/semesters", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    semesterId: semester._id,
                    ues
                })
            });

            const data = await response.json();

            if (data.success) {
                setHasChanges(false);
                onUpdate(data.semester);
                alert("✅ Notes enregistrées !");
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error saving grades:", error);
            alert("❌ Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const semesterAverage = calculateSemesterAverage(ues);
    const totalECTS = ues.reduce((sum, ue) => sum + ue.ects, 0);
    const ectsObtained = ues.reduce((sum, ue) => {
        const avg = calculateUEAverage(ue.modules);
        return sum + (avg !== null && avg >= 10 ? ue.ects : 0);
    }, 0);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="px-2 md:px-4 cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Retour</span>
                    </Button>
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold">{semester.name}</h2>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            {semester.cursus} • {semester.filiere} • {semester.groupe}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges || semester.locked}
                    size="default"
                    className="w-full sm:w-auto cursor-pointer"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer
                </Button>
            </div>

            {/* Summary Card */}
            <Card>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold text-primary">
                                {semesterAverage !== null ? semesterAverage.toFixed(2) : "-"}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">Moyenne</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold">
                                {ectsObtained}/{totalECTS}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">ECTS</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold">{ues.length}</div>
                            <div className="text-xs md:text-sm text-muted-foreground">UEs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold">
                                {ues.reduce((sum, ue) => sum + ue.modules.length, 0)}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">Modules</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {semester.locked && (
                <Card className="border-yellow-500 bg-yellow-500/10">
                    <CardContent className="p-4 text-center">
                        <p className="text-yellow-700 dark:text-yellow-300">
                            🔒 Ce semestre est verrouillé. Vous ne pouvez pas modifier les notes.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* UEs Accordion */}
            {ues.length === 0 ? (
                <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-bold mb-2">Aucune UE définie</h3>
                        <p className="text-muted-foreground">
                            Ce semestre n&apos;a pas encore d&apos;UE configurées.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="multiple" className="space-y-3 md:space-y-4" defaultValue={ues.map(ue => ue.id)}>
                    {ues.map((ue, ueIndex) => {
                        const ueAverage = calculateUEAverage(ue.modules);
                        const isValidated = ueAverage !== null && ueAverage >= 10;

                        return (
                            <AccordionItem key={ue.id} value={ue.id} className="border rounded-lg">
                                <AccordionTrigger className="px-3 md:px-6 hover:no-underline cursor-pointer">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mr-2 md:mr-4 gap-2">
                                        <div className="flex flex-wrap items-center gap-1 md:gap-3">
                                            <Badge variant="outline" className="text-xs">{ue.code}</Badge>
                                            <span className="font-semibold text-sm md:text-base">{ue.name}</span>
                                            <div className="flex gap-1">
                                                <Badge variant="secondary" className="text-xs">{ue.ects} ECTS</Badge>
                                                <Badge variant="outline" className="text-xs hidden sm:inline-flex">Coef {ue.coefficient}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {ueAverage !== null ? (
                                                <Badge
                                                    variant={isValidated ? "default" : "destructive"}
                                                    className="text-sm md:text-base px-2 md:px-3 py-1"
                                                >
                                                    {ueAverage.toFixed(2)}/20
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-sm md:text-base px-2 md:px-3 py-1">
                                                    -/20
                                                </Badge>
                                            )}
                                            {isValidated && (
                                                <Badge className="bg-green-500 text-xs">✓</Badge>
                                            )}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 md:px-6 pb-4 md:pb-6">
                                    <div className="space-y-4 md:space-y-6">
                                        {ue.modules.map((module, moduleIndex) => {
                                            const moduleAverage = calculateModuleAverage(module.grades);

                                            return (
                                                <Card key={module.id}>
                                                    <CardHeader className="py-3 md:py-4 px-3 md:px-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="flex flex-wrap items-center gap-1 md:gap-3">
                                                                <Badge variant="outline" className="text-xs">{module.code}</Badge>
                                                                <CardTitle className="text-sm md:text-base">{module.name}</CardTitle>
                                                                <Badge variant="secondary" className="text-xs">Coef {module.coefficient}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                                <Calculator className="h-4 w-4 text-muted-foreground" />
                                                                {moduleAverage !== null ? (
                                                                    <span className={`font-bold ${moduleAverage >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {moduleAverage.toFixed(2)}/20
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-/20</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0 px-3 md:px-6">
                                                        {module.grades.length === 0 ? (
                                                            <p className="text-muted-foreground text-center py-4">
                                                                Aucune note définie pour ce module
                                                            </p>
                                                        ) : (
                                                            <>
                                                                {/* Mobile view - cards */}
                                                                <div className="md:hidden space-y-3">
                                                                    {module.grades.map((grade, gradeIndex) => {
                                                                        const normalized = grade.grade !== null
                                                                            ? (grade.grade / grade.maxGrade) * 20
                                                                            : null;

                                                                        return (
                                                                            <div key={grade.id} className="border rounded-lg p-3 space-y-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="font-medium text-sm">{grade.name}</span>
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {grade.type}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <span className="text-xs text-muted-foreground">Coef {grade.coefficient}</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            max={grade.maxGrade}
                                                                                            step="0.01"
                                                                                            value={grade.grade ?? ""}
                                                                                            onChange={(e) => handleGradeChange(
                                                                                                ueIndex,
                                                                                                moduleIndex,
                                                                                                gradeIndex,
                                                                                                e.target.value
                                                                                            )}
                                                                                            disabled={semester.locked}
                                                                                            className="w-16 text-center h-8"
                                                                                            placeholder="-"
                                                                                        />
                                                                                        <span className="text-xs text-muted-foreground">/{grade.maxGrade}</span>
                                                                                        <span className="text-xs">→</span>
                                                                                        {normalized !== null ? (
                                                                                            <span className={`font-medium text-sm ${normalized >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {normalized.toFixed(1)}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-muted-foreground text-sm">-</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Desktop view - table */}
                                                                <div className="hidden md:block">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Évaluation</TableHead>
                                                                                <TableHead>Type</TableHead>
                                                                                <TableHead className="text-center">Coef</TableHead>
                                                                                <TableHead className="text-center">Note</TableHead>
                                                                                <TableHead className="text-center">Max</TableHead>
                                                                                <TableHead className="text-center">/20</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {module.grades.map((grade, gradeIndex) => {
                                                                                const normalized = grade.grade !== null
                                                                                    ? (grade.grade / grade.maxGrade) * 20
                                                                                    : null;

                                                                                return (
                                                                                    <TableRow key={grade.id}>
                                                                                        <TableCell className="font-medium">
                                                                                            {grade.name}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <Badge variant="outline" className="text-xs">
                                                                                                {getGradeTypeLabel(grade.type)}
                                                                                            </Badge>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center">
                                                                                            {grade.coefficient}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center">
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                max={grade.maxGrade}
                                                                                                step="0.01"
                                                                                                value={grade.grade ?? ""}
                                                                                                onChange={(e) => handleGradeChange(
                                                                                                    ueIndex,
                                                                                                    moduleIndex,
                                                                                                    gradeIndex,
                                                                                                    e.target.value
                                                                                                )}
                                                                                                disabled={semester.locked}
                                                                                                className="w-20 text-center mx-auto"
                                                                                                placeholder="-"
                                                                                            />
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center text-muted-foreground">
                                                                                            /{grade.maxGrade}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center">
                                                                                            {normalized !== null ? (
                                                                                                <span className={`font-medium ${normalized >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                    {normalized.toFixed(2)}
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-muted-foreground">-</span>
                                                                                            )}
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                );
                                                                            })}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            {/* Save button at bottom */}
            {hasChanges && !semester.locked && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        className="shadow-lg w-full md:w-auto cursor-pointer"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        <span className="md:hidden">Enregistrer</span>
                        <span className="hidden md:inline">Enregistrer les modifications</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
