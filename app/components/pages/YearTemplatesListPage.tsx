"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Shield, Loader2, Calendar, BookOpen, Pencil } from "lucide-react";
import { AcademicYearTemplate } from "@lib/grades/types";
import Link from "next/link";

export default function YearTemplatesListPage() {
    const [templates, setTemplates] = useState<AcademicYearTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await fetch("/api/admin/year-templates");
            const data = await response.json();

            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error("Error loading templates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string, name: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${name}" ?\n\nCette action est irréversible.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/year-templates?templateId=${templateId}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Template supprimé avec succès");
                await loadTemplates();
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error deleting template:", error);
            alert("❌ Erreur lors de la suppression");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Chargement des templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="px-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-4xl font-bold">Templates d&apos;Année</h1>
                                <p className="text-muted-foreground">
                                    Gérer les templates avec S1 et S2
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/year-templates/create">
                            <Button size="lg">
                                <Plus className="mr-2 h-5 w-5" />
                                Créer un template
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Templates List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Templates ({templates.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {templates.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-bold mb-2">Aucun template</h3>
                                <p className="text-muted-foreground mb-6">
                                    Créez votre premier template d&apos;année pour commencer
                                </p>
                                <Link href="/admin/year-templates/create">
                                    <Button size="lg">
                                        <Plus className="mr-2 h-5 w-5" />
                                        Créer un template
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Cursus</TableHead>
                                        <TableHead>Filière</TableHead>
                                        <TableHead>Groupe</TableHead>
                                        <TableHead>Année</TableHead>
                                        <TableHead>Semestres</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((template) => {
                                        const hasS1 = template.semesters.some(s => s.semester === 1);
                                        const hasS2 = template.semesters.some(s => s.semester === 2);
                                        const s1 = template.semesters.find(s => s.semester === 1);
                                        const s2 = template.semesters.find(s => s.semester === 2);

                                        return (
                                            <TableRow key={template._id}>
                                                <TableCell className="font-medium">{template.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{template.cursus}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{template.filiere}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{template.groupe}</Badge>
                                                </TableCell>
                                                <TableCell>{template.academicYear}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {hasS1 ? (
                                                            <Badge className="bg-green-500">
                                                                S1 ({s1?.ues.length} UEs, {s1?.totalECTS} ECTS)
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground">
                                                                S1 ✕
                                                            </Badge>
                                                        )}
                                                        {hasS2 ? (
                                                            <Badge className="bg-blue-500">
                                                                S2 ({s2?.ues.length} UEs, {s2?.totalECTS} ECTS)
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground">
                                                                S2 ✕
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">v{template.version}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/admin/year-templates/edit/${template._id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Modifier"
                                                                className={"cursor-pointer"}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Supprimer"
                                                            className={"cursor-pointer"}
                                                            onClick={() => handleDeleteTemplate(template._id, template.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Stats */}
                {templates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <Calendar className="h-10 w-10 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Templates</p>
                                        <p className="text-3xl font-bold">{templates.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <BookOpen className="h-10 w-10 text-green-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avec S1</p>
                                        <p className="text-3xl font-bold">
                                            {templates.filter(t => t.semesters.some(s => s.semester === 1)).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <BookOpen className="h-10 w-10 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avec S2</p>
                                        <p className="text-3xl font-bold">
                                            {templates.filter(t => t.semesters.some(s => s.semester === 2)).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
