import React, {Fragment, useEffect, useState} from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {BookOpen, Loader2, Plus} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {loadAvailableTemplates} from "@components/client_functions/templates";
import {TemplateOption} from "@components/client_types/templates";

type AddAcademicPathProps = {
    onPathAdded: () => void;
    disabled?: boolean;
}

function AddAcademicPath({onPathAdded, disabled}: AddAcademicPathProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedOption, setSelectedOption] = useState<TemplateOption | null>(null);

    useEffect(() => {
        if (dialogOpen && disabled !== true) {
            loadAvailableTemplates(disabled, setLoadingTemplates, setTemplateOptions);
        }
    }, [dialogOpen, disabled]);

    const handleAddPath = async () => {
        if (disabled) return;

        if (!selectedOption) {
            alert("Veuillez sélectionner un parcours");
            return;
        }

        try {
            const response = await fetch("/api/grades/paths", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
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
                onPathAdded();
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error adding path:", error);
            alert("❌ Erreur lors de l'ajout du parcours");
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button size="default" className="w-full sm:w-auto cursor-pointer" disabled={disabled}>
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
                        <Fragment>
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
                                    className="flex-1 cursor-pointer transition-all hover:shadow-md text-primary"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleAddPath}
                                    disabled={!selectedOption}
                                    className="flex-1 cursor-pointer"
                                >
                                    Ajouter ce parcours
                                </Button>
                            </div>
                        </Fragment>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default AddAcademicPath;