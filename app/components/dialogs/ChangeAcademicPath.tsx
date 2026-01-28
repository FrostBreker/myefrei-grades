import React, {Fragment, useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {AlertTriangle, BookOpen, Loader2, RefreshCw} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from "@/components/ui/alert-dialog";
import {AcademicPath} from "@lib/grades/types";
import {TemplateOption} from "@components/client_types/templates";
import {loadAvailableTemplates} from "@components/client_functions/templates";


type ChangeAcademicPathProps = {
    disabled?: boolean;
    activePath: AcademicPath | null
    refreshData: () => void;
}

function ChangeAcademicPath({disabled, activePath, refreshData}: ChangeAcademicPathProps) {
    const [changePathDialogOpen, setChangePathDialogOpen] = useState(false);
    const [confirmChangeDialogOpen, setConfirmChangeDialogOpen] = useState(false);
    const [changingPath, setChangingPath] = useState(false);
    const [selectedChangeOption, setSelectedChangeOption] = useState<TemplateOption | null>(null);

    const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    useEffect(() => {
        if (changePathDialogOpen && disabled !== true) {
            loadAvailableTemplates(disabled, setLoadingTemplates, setTemplateOptions);
        }
    }, [changePathDialogOpen, disabled]);


    const handleChangePath = async () => {
        if (!selectedChangeOption || !activePath) return;

        setChangingPath(true);
        try {
            // 1. Delete the current active path
            const deleteResponse = await fetch(`/api/grades/paths?pathId=${activePath.id}`, {
                method: "DELETE"
            });

            const deleteData = await deleteResponse.json();

            if (!deleteData.success) {
                alert(`❌ Erreur lors de la suppression : ${deleteData.error}`);
                setChangingPath(false);
                return;
            }

            // 2. Add the new path
            const addResponse = await fetch("/api/grades/paths", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    cursus: selectedChangeOption.cursus,
                    filiere: selectedChangeOption.filiere,
                    groupe: selectedChangeOption.groupe,
                    academicYear: selectedChangeOption.academicYear !== "Non spécifié" ? selectedChangeOption.academicYear : undefined,
                    setAsActive: true
                })
            });

            const addData = await addResponse.json();

            if (addData.success) {
                alert("✅ Parcours changé avec succès !");
                setChangePathDialogOpen(false);
                setConfirmChangeDialogOpen(false);
                setSelectedChangeOption(null);
                refreshData();
            } else {
                alert(`❌ Erreur lors de l'ajout : ${addData.error}`);
            }
        } catch (error) {
            console.error("Error changing path:", error);
            alert("❌ Erreur lors du changement de parcours");
        } finally {
            setChangingPath(false);
        }
    };

    return (
        <Fragment>
            <Dialog open={changePathDialogOpen} onOpenChange={setChangePathDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="flex-1 cursor-pointer max-w-xs"
                        variant="outline"
                        disabled={disabled}
                    >
                        <RefreshCw className="h-4 w-4 mr-2"/>
                        Changer mon parcours
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5"/>
                            Changer mon parcours actuel
                        </DialogTitle>
                        <DialogDescription>
                    <span className="flex items-center gap-2 text-amber-600 mt-2">
                        <AlertTriangle className="h-4 w-4"/>
                        Attention : Cette action remplacera votre parcours actuel et supprimera toutes les notes associées.
                    </span>
                        </DialogDescription>
                    </DialogHeader>

                    {activePath && (
                        <div className="my-4 p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-2">Parcours actuel :</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{activePath.cursus}</Badge>
                                <Badge variant="secondary">{activePath.filiere}</Badge>
                                <Badge variant="outline">{activePath.groupe}</Badge>
                                <span className="text-sm text-muted-foreground">({activePath.academicYear})</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 py-4">
                        <p className="text-sm font-medium">Sélectionnez votre nouveau parcours :</p>
                        {loadingTemplates ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"/>
                                <p className="text-muted-foreground">Chargement des parcours disponibles...</p>
                            </div>
                        ) : templateOptions.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground"/>
                                <p className="text-muted-foreground">
                                    Aucun parcours disponible. Contactez un administrateur.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 max-h-75 overflow-y-auto">
                                    {templateOptions
                                        .filter(option =>
                                            // Exclure le parcours actuel de la liste
                                            !(activePath &&
                                                option.cursus === activePath.cursus &&
                                                option.filiere === activePath.filiere &&
                                                option.groupe === activePath.groupe &&
                                                option.academicYear === activePath.academicYear)
                                        )
                                        .map((option, index) => (
                                            <Card
                                                key={index}
                                                className={`cursor-pointer transition-all hover:shadow-md ${
                                                    selectedChangeOption === option
                                                        ? "border-2 border-primary bg-primary/5"
                                                        : "border-2 border-transparent"
                                                }`}
                                                onClick={() => setSelectedChangeOption(option)}
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
                                                        {selectedChangeOption === option && (
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
                                            setChangePathDialogOpen(false);
                                            setSelectedChangeOption(null);
                                        }}
                                        className="flex-1 cursor-pointer"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={() => setConfirmChangeDialogOpen(true)}
                                        disabled={!selectedChangeOption}
                                        variant="destructive"
                                        className="flex-1 cursor-pointer"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2"/>
                                        Changer de parcours
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation AlertDialog */}
            <AlertDialog open={confirmChangeDialogOpen} onOpenChange={setConfirmChangeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5"/>
                            Confirmer le changement de parcours
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                Vous êtes sur le point de remplacer votre parcours actuel. Cette action est irréversible.
                            </p>
                            {activePath && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Parcours qui sera supprimé :</p>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {activePath.cursus} {activePath.filiere} {activePath.groupe} ({activePath.academicYear})
                                    </p>
                                </div>
                            )}
                            {selectedChangeOption && (
                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Nouveau parcours :</p>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        {selectedChangeOption.cursus} {selectedChangeOption.filiere} {selectedChangeOption.groupe} ({selectedChangeOption.academicYear})
                                    </p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleChangePath}
                            disabled={changingPath}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                        >
                            {changingPath ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                    Changement en cours...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2"/>
                                    Confirmer le changement
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Fragment>
    );
}

export default ChangeAcademicPath;