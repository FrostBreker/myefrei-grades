"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Plus, Trash2, Shield, Loader2, X, ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";
import { UE, Module as ModuleType, GradeEntry, GradeType, SemesterData, AcademicYearTemplate } from "@lib/grades/types";
import Link from "next/link";

const GRADE_TYPES: { value: GradeType; label: string }[] = [
    { value: "TP", label: "TP - Travaux Pratiques" },
    { value: "TD", label: "TD - Travaux Dirigés" },
    { value: "PRJ", label: "PRJ - Projet" },
    { value: "DE", label: "DE - Devoir Écrit" },
    { value: "CC", label: "CC - Contrôle Continu" },
    { value: "CO", label: "CO - Contrôle Oral" },
    { value: "CE", label: "CE - Contrôle Écrit" },
    { value: "TOEIC", label: "TOEIC" },
    { value: "AUTRE", label: "Autre" }
];

interface EditYearTemplatePageProps {
    templateId: string;
}

export default function EditYearTemplatePage({ templateId }: EditYearTemplatePageProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [template, setTemplate] = useState<AcademicYearTemplate | null>(null);

    // Semester toggles
    const [defineS1, setDefineS1] = useState(false);
    const [defineS2, setDefineS2] = useState(false);

    // Semester 1 data
    const [uesS1, setUesS1] = useState<UE[]>([]);

    // Semester 2 data
    const [uesS2, setUesS2] = useState<UE[]>([]);

    useEffect(() => {
        loadTemplate();
    }, [templateId]);

    const loadTemplate = async () => {
        try {
            const response = await fetch(`/api/admin/year-templates/${templateId}`);
            const data = await response.json();

            if (data.success && data.template) {
                setTemplate(data.template);

                // Check which semesters are defined
                const s1 = data.template.semesters.find((s: SemesterData) => s.semester === 1);
                const s2 = data.template.semesters.find((s: SemesterData) => s.semester === 2);

                setDefineS1(!!s1);
                setDefineS2(!!s2);

                if (s1) setUesS1(s1.ues);
                if (s2) setUesS2(s2.ues);
            } else {
                alert("Template non trouvé");
                router.push("/admin/year-templates");
            }
        } catch (error) {
            console.error("Error loading template:", error);
            alert("Erreur lors du chargement du template");
        } finally {
            setLoading(false);
        }
    };

    // UE Management for S1
    const addUES1 = () => {
        const newUE: UE = {
            id: `UE_S1_${Date.now()}`,
            name: "",
            code: "",
            ects: 0,
            coefficient: 1,
            modules: [],
            average: null
        };
        setUesS1([...uesS1, newUE]);
    };

    const updateUES1 = (index: number, field: keyof UE, value: string | number | boolean | null | ModuleType[]) => {
        const updated = [...uesS1];
        updated[index] = { ...updated[index], [field]: value };
        setUesS1(updated);
    };

    const removeUES1 = (index: number) => {
        setUesS1(uesS1.filter((_, i) => i !== index));
    };

    // UE Management for S2
    const addUES2 = () => {
        const newUE: UE = {
            id: `UE_S2_${Date.now()}`,
            name: "",
            code: "",
            ects: 0,
            coefficient: 1,
            modules: [],
            average: null
        };
        setUesS2([...uesS2, newUE]);
    };

    const updateUES2 = (index: number, field: keyof UE, value: string | number | boolean | null | ModuleType[]) => {
        const updated = [...uesS2];
        updated[index] = { ...updated[index], [field]: value };
        setUesS2(updated);
    };

    const removeUES2 = (index: number) => {
        setUesS2(uesS2.filter((_, i) => i !== index));
    };

    // Module Management
    const addModule = (semesterNum: 1 | 2, ueIndex: number) => {
        const newModule: ModuleType = {
            id: `MOD_S${semesterNum}_${Date.now()}`,
            name: "",
            code: "",
            coefficient: 1,
            grades: [],
            average: null
        };

        if (semesterNum === 1) {
            const updated = [...uesS1];
            updated[ueIndex].modules.push(newModule);
            setUesS1(updated);
        } else {
            const updated = [...uesS2];
            updated[ueIndex].modules.push(newModule);
            setUesS2(updated);
        }
    };

    const updateModule = (semesterNum: 1 | 2, ueIndex: number, moduleIndex: number, field: keyof ModuleType, value: string | number | boolean | null | GradeEntry[]) => {
        if (semesterNum === 1) {
            const updated = [...uesS1];
            updated[ueIndex].modules[moduleIndex] = {
                ...updated[ueIndex].modules[moduleIndex],
                [field]: value
            };
            setUesS1(updated);
        } else {
            const updated = [...uesS2];
            updated[ueIndex].modules[moduleIndex] = {
                ...updated[ueIndex].modules[moduleIndex],
                [field]: value
            };
            setUesS2(updated);
        }
    };

    const removeModule = (semesterNum: 1 | 2, ueIndex: number, moduleIndex: number) => {
        if (semesterNum === 1) {
            const updated = [...uesS1];
            updated[ueIndex].modules = updated[ueIndex].modules.filter((_, i) => i !== moduleIndex);
            setUesS1(updated);
        } else {
            const updated = [...uesS2];
            updated[ueIndex].modules = updated[ueIndex].modules.filter((_, i) => i !== moduleIndex);
            setUesS2(updated);
        }
    };

    // Grade Management
    const addGrade = (semesterNum: 1 | 2, ueIndex: number, moduleIndex: number) => {
        const newGrade: GradeEntry = {
            id: `GRADE_S${semesterNum}_${Date.now()}`,
            type: "CC",
            name: "",
            coefficient: 1,
            grade: null,
            maxGrade: 20
        };

        if (semesterNum === 1) {
            const updated = [...uesS1];
            updated[ueIndex].modules[moduleIndex].grades.push(newGrade);
            setUesS1(updated);
        } else {
            const updated = [...uesS2];
            updated[ueIndex].modules[moduleIndex].grades.push(newGrade);
            setUesS2(updated);
        }
    };

    const updateGrade = (semesterNum: 1 | 2, ueIndex: number, moduleIndex: number, gradeIndex: number, field: keyof GradeEntry, value: string | number | boolean | null | Date | GradeType) => {
        if (semesterNum === 1) {
            const updated = [...uesS1];
            updated[ueIndex].modules[moduleIndex].grades[gradeIndex] = {
                ...updated[ueIndex].modules[moduleIndex].grades[gradeIndex],
                [field]: value
            };
            setUesS1(updated);
        } else {
            const updated = [...uesS2];
            updated[ueIndex].modules[moduleIndex].grades[gradeIndex] = {
                ...updated[ueIndex].modules[moduleIndex].grades[gradeIndex],
                [field]: value
            };
            setUesS2(updated);
        }
    };

    const removeGrade = (semesterNum: 1 | 2, ueIndex: number, moduleIndex: number, gradeIndex: number) => {
        if (semesterNum === 1) {
            const updated = [...uesS1];
            updated[ueIndex].modules[moduleIndex].grades =
                updated[ueIndex].modules[moduleIndex].grades.filter((_, i) => i !== gradeIndex);
            setUesS1(updated);
        } else {
            const updated = [...uesS2];
            updated[ueIndex].modules[moduleIndex].grades =
                updated[ueIndex].modules[moduleIndex].grades.filter((_, i) => i !== gradeIndex);
            setUesS2(updated);
        }
    };

    const handleUpdateTemplate = async () => {
        if (!defineS1 && !defineS2) {
            alert("Veuillez définir au moins un semestre (S1 ou S2)");
            return;
        }

        const semesters: SemesterData[] = [];

        // Build S1 if defined
        if (defineS1) {
            if (uesS1.length === 0) {
                alert("Semestre 1 : Au moins une UE est requise");
                return;
            }

            for (const ue of uesS1) {
                if (!ue.name || !ue.code || ue.ects <= 0) {
                    alert(`S1 - UE "${ue.name || 'Sans nom'}" : Nom, code et ECTS sont requis`);
                    return;
                }
                if (ue.modules.length === 0) {
                    alert(`S1 - UE "${ue.name}" : Au moins un module est requis`);
                    return;
                }
                for (const mod of ue.modules) {
                    if (!mod.name || !mod.code) {
                        alert(`S1 - Module dans UE "${ue.name}" : Nom et code sont requis`);
                        return;
                    }
                    if (mod.grades.length === 0) {
                        alert(`S1 - Module "${mod.name}" : Au moins une évaluation est requise`);
                        return;
                    }
                }
            }

            const totalECTS_S1 = uesS1.reduce((sum, ue) => sum + ue.ects, 0);
            semesters.push({
                semester: 1,
                name: "Semestre 1",
                ues: uesS1,
                totalECTS: totalECTS_S1
            });
        }

        // Build S2 if defined
        if (defineS2) {
            if (uesS2.length === 0) {
                alert("Semestre 2 : Au moins une UE est requise");
                return;
            }

            for (const ue of uesS2) {
                if (!ue.name || !ue.code || ue.ects <= 0) {
                    alert(`S2 - UE "${ue.name || 'Sans nom'}" : Nom, code et ECTS sont requis`);
                    return;
                }
                if (ue.modules.length === 0) {
                    alert(`S2 - UE "${ue.name}" : Au moins un module est requis`);
                    return;
                }
                for (const mod of ue.modules) {
                    if (!mod.name || !mod.code) {
                        alert(`S2 - Module dans UE "${ue.name}" : Nom et code sont requis`);
                        return;
                    }
                    if (mod.grades.length === 0) {
                        alert(`S2 - Module "${mod.name}" : Au moins une évaluation est requise`);
                        return;
                    }
                }
            }

            const totalECTS_S2 = uesS2.reduce((sum, ue) => sum + ue.ects, 0);
            semesters.push({
                semester: 2,
                name: "Semestre 2",
                ues: uesS2,
                totalECTS: totalECTS_S2
            });
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/admin/year-templates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId,
                    semesters
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ Template mis à jour ! (Version ${data.template.version})\n\nLes utilisateurs seront synchronisés automatiquement.`);
                router.push("/admin/year-templates");
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error updating template:", error);
            alert("❌ Erreur lors de la mise à jour du template");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSyncUsers = async () => {
        if (!confirm("Voulez-vous synchroniser tous les utilisateurs avec ce template ?\n\nLes notes existantes seront préservées.")) {
            return;
        }

        setSyncing(true);

        try {
            const response = await fetch(`/api/admin/year-templates/${templateId}/sync`, {
                method: "POST"
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ Synchronisation terminée !\n\n${data.updatedCount} utilisateur(s) mis à jour.`);
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error syncing users:", error);
            alert("❌ Erreur lors de la synchronisation");
        } finally {
            setSyncing(false);
        }
    };

    const getTotalECTS = (ues: UE[]) => {
        return ues.reduce((sum, ue) => sum + (ue.ects || 0), 0);
    };

    const renderSemesterSection = (
        semesterNum: 1 | 2,
        isDefined: boolean,
        setIsDefined: (val: boolean) => void,
        ues: UE[],
        addUE: () => void,
        updateUE: (index: number, field: keyof UE, value: string | number | boolean | null | ModuleType[]) => void,
        removeUE: (index: number) => void
    ) => (
        <Card className="border-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={isDefined}
                            onCheckedChange={(checked) => setIsDefined(checked as boolean)}
                            id={`semester-${semesterNum}`}
                        />
                        <label
                            htmlFor={`semester-${semesterNum}`}
                            className="text-xl font-bold cursor-pointer"
                        >
                            Définir Semestre {semesterNum}
                        </label>
                        {isDefined && (
                            <Badge variant="secondary">
                                {ues.length} UE(s) • {getTotalECTS(ues)} ECTS
                            </Badge>
                        )}
                    </div>
                    {isDefined && (
                        <Button onClick={addUE}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter UE
                        </Button>
                    )}
                </div>
            </CardHeader>

            {isDefined && (
                <CardContent>
                    {ues.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">
                                Aucune UE. Cliquez sur &quot;Ajouter UE&quot; pour commencer.
                            </p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="space-y-4">
                            {ues.map((ue, ueIndex) => (
                                <AccordionItem key={ueIndex} value={`s${semesterNum}-ue-${ueIndex}`} className="border-2 rounded-lg">
                                    <Card>
                                        <AccordionTrigger className="px-6 hover:no-underline">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">UE {ueIndex + 1}</Badge>
                                                    <span className="font-semibold">
                                                        {ue.name || "Sans nom"} ({ue.ects} ECTS, Coef {ue.coefficient})
                                                    </span>
                                                    <Badge variant="secondary">
                                                        {ue.modules.length} module(s)
                                                    </Badge>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeUE(ueIndex);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <CardContent className="space-y-6 pt-4">
                                                {/* UE Fields */}
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Nom UE *</Label>
                                                        <Input
                                                            placeholder="Informatique"
                                                            value={ue.name}
                                                            onChange={(e) => updateUE(ueIndex, "name", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Code *</Label>
                                                        <Input
                                                            placeholder="INFO1"
                                                            value={ue.code}
                                                            onChange={(e) => updateUE(ueIndex, "code", e.target.value.toUpperCase())}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>ECTS *</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={ue.ects || ""}
                                                            onChange={(e) => updateUE(ueIndex, "ects", parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Coefficient *</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            value={ue.coefficient}
                                                            onChange={(e) => updateUE(ueIndex, "coefficient", parseFloat(e.target.value) || 1)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Modules */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between border-t pt-4">
                                                        <Label>Modules</Label>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => addModule(semesterNum, ueIndex)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Ajouter module
                                                        </Button>
                                                    </div>

                                                    {ue.modules.length === 0 ? (
                                                        <Card className="border-dashed">
                                                            <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                                                Aucun module
                                                            </CardContent>
                                                        </Card>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {ue.modules.map((mod, modIndex) => (
                                                                <Card key={modIndex} className="border-l-4 border-l-primary bg-muted/30">
                                                                    <CardContent className="p-4 space-y-4">
                                                                        <div className="flex items-start justify-between">
                                                                            <Badge>Module {modIndex + 1}</Badge>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => removeModule(semesterNum, ueIndex, modIndex)}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm">Nom *</Label>
                                                                                <Input
                                                                                    placeholder="Programmation"
                                                                                    value={mod.name}
                                                                                    onChange={(e) => updateModule(semesterNum, ueIndex, modIndex, "name", e.target.value)}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm">Code *</Label>
                                                                                <Input
                                                                                    placeholder="PROG101"
                                                                                    value={mod.code}
                                                                                    onChange={(e) => updateModule(semesterNum, ueIndex, modIndex, "code", e.target.value.toUpperCase())}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm">Coef *</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="0.5"
                                                                                    value={mod.coefficient}
                                                                                    onChange={(e) => updateModule(semesterNum, ueIndex, modIndex, "coefficient", parseFloat(e.target.value) || 1)}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Grades */}
                                                                        <div className="space-y-3 pt-3 border-t">
                                                                            <div className="flex items-center justify-between">
                                                                                <Label className="text-sm">Évaluations ({mod.grades.length})</Label>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    onClick={() => addGrade(semesterNum, ueIndex, modIndex)}
                                                                                >
                                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                                    Ajouter
                                                                                </Button>
                                                                            </div>

                                                                            {mod.grades.length === 0 ? (
                                                                                <p className="text-xs text-muted-foreground text-center py-3">
                                                                                    Aucune évaluation
                                                                                </p>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    {mod.grades.map((grade, gradeIndex) => (
                                                                                        <div key={gradeIndex} className="grid grid-cols-5 gap-2 p-3 bg-background rounded border">
                                                                                            <div>
                                                                                                <Select
                                                                                                    value={grade.type}
                                                                                                    onValueChange={(val) => updateGrade(semesterNum, ueIndex, modIndex, gradeIndex, "type", val as GradeType)}
                                                                                                >
                                                                                                    <SelectTrigger className="h-9">
                                                                                                        <SelectValue />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        {GRADE_TYPES.map(gt => (
                                                                                                            <SelectItem key={gt.value} value={gt.value}>
                                                                                                                {gt.label}
                                                                                                            </SelectItem>
                                                                                                        ))}
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Input
                                                                                                    className="h-9"
                                                                                                    placeholder="Nom"
                                                                                                    value={grade.name}
                                                                                                    onChange={(e) => updateGrade(semesterNum, ueIndex, modIndex, gradeIndex, "name", e.target.value)}
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <Input
                                                                                                    className="h-9"
                                                                                                    type="number"
                                                                                                    min="0"
                                                                                                    step="0.5"
                                                                                                    placeholder="Coef"
                                                                                                    value={grade.coefficient}
                                                                                                    onChange={(e) => updateGrade(semesterNum, ueIndex, modIndex, gradeIndex, "coefficient", parseFloat(e.target.value) || 1)}
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <Input
                                                                                                    className="h-9"
                                                                                                    type="number"
                                                                                                    min="1"
                                                                                                    placeholder="Max"
                                                                                                    value={grade.maxGrade}
                                                                                                    onChange={(e) => updateGrade(semesterNum, ueIndex, modIndex, gradeIndex, "maxGrade", parseFloat(e.target.value) || 20)}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex justify-end">
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    variant="ghost"
                                                                                                    size="icon"
                                                                                                    className="h-9 w-9"
                                                                                                    onClick={() => removeGrade(semesterNum, ueIndex, modIndex, gradeIndex)}
                                                                                                >
                                                                                                    <X className="h-4 w-4" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            )}
        </Card>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Chargement du template...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container px-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/admin/year-templates">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-4xl font-bold">Modifier le Template</h1>
                                <p className="text-muted-foreground">
                                    {template.name} (Version {template.version})
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Alert about synchronization */}
                    <Alert className="mb-6">
                        <RefreshCw className="h-4 w-4" />
                        <AlertTitle>Synchronisation automatique</AlertTitle>
                        <AlertDescription>
                            Quand vous modifiez ce template, les changements seront automatiquement appliqués
                            aux utilisateurs qui l&apos;utilisent. Les notes existantes seront préservées.
                        </AlertDescription>
                    </Alert>
                </div>

                <div className="space-y-6">
                    {/* Template Info (read-only) */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle>Informations du template</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Cursus</Label>
                                    <p className="font-medium">{template.cursus}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Filière</Label>
                                    <p className="font-medium">{template.filiere}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Groupe</Label>
                                    <p className="font-medium">{template.groupe}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Année</Label>
                                    <p className="font-medium">{template.academicYear}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Semester 1 */}
                    {renderSemesterSection(1, defineS1, setDefineS1, uesS1, addUES1, updateUES1, removeUES1)}

                    {/* Semester 2 */}
                    {renderSemesterSection(2, defineS2, setDefineS2, uesS2, addUES2, updateUES2, removeUES2)}

                    {/* Actions */}
                    <div className="flex justify-between gap-4 sticky bottom-0 bg-background py-4 border-t">
                        <div className="flex gap-2">
                            <Link href="/admin/year-templates">
                                <Button variant="outline" size="lg">
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Annuler
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleSyncUsers}
                                disabled={syncing}
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Synchronisation...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-5 w-5" />
                                        Sync utilisateurs
                                    </>
                                )}
                            </Button>
                        </div>
                        <Button
                            size="lg"
                            onClick={handleUpdateTemplate}
                            disabled={submitting || (!defineS1 && !defineS2)}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Mise à jour en cours...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    Enregistrer les modifications
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
