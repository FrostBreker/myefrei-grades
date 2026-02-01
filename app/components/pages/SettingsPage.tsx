"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    User,
    Shield,
    Trash2,
    LogOut,
    Moon,
    Sun,
    Monitor,
    ExternalLink,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { useTheme } from "next-themes";
import {UserDB} from "@lib/user/types";
import {Switch} from "@/components/ui/switch";

interface SettingsPageProps {
    user:UserDB;
}

export default function SettingsPage({ user }: SettingsPageProps) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [nameInStats, setNameInStats] = useState(user.nameInStats || false);

    const [edited, setEdited] = useState(false);
    const [text, setText] = useState("-");

    const handlerChangeNameInStats = async (value: boolean) => {
        setNameInStats(value);
        setEdited(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    studentNumber: user.studentNumber,
                    nameInStats: value
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setText("success-Paramètre mis à jour avec succès");
            } else {
                setText("error-" + (data.error || "Erreur lors de la mise à jour du profil"));
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Erreur lors de la sauvegarde du profil");
            setText("error-Erreur lors de la mise à jour du profil");
        } finally {
            setTimeout(() => {
                setEdited(false);
                setText("-");
            }, 3000);
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch("/api/user/delete", {
                method: "DELETE",
            });

            if (response.ok) {
                await signOut({ callbackUrl: "/" });
            } else {
                alert("Erreur lors de la suppression du compte");
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Erreur lors de la suppression du compte");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const themeOptions = [
        { value: "light", label: "Clair", icon: Sun },
        { value: "dark", label: "Sombre", icon: Moon },
        { value: "system", label: "Système", icon: Monitor },
    ];

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted py-8 md:py-12">
            <div className="px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                        Paramètres
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Gère tes préférences et ton compte
                    </p>
                </div>

                {/* Appearance Settings */}
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                <Sun className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Apparence</CardTitle>
                                <CardDescription>Personnalise l&apos;affichage de l&apos;application</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-3">Thème</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {themeOptions.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setTheme(option.value)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                                    theme === option.value
                                                        ? "border-primary bg-primary/5"
                                                        : "border-muted hover:border-primary/50"
                                                }`}
                                            >
                                                <Icon className={`h-5 w-5 ${theme === option.value ? "text-primary" : "text-muted-foreground"}`} />
                                                <span className={`text-sm font-medium ${theme === option.value ? "text-primary" : ""}`}>
                                                    {option.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Compte</CardTitle>
                                <CardDescription>Gère ton compte et tes informations</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">Email</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="secondary">Google</Badge>
                        </div>
                        <div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div>
                                    <p className="font-medium">Afficher mon nom dans les statistiques</p>
                                    <p className="text-sm text-muted-foreground">
                                        Choisis si tu souhaites que ton nom apparaisse dans les statistiques globales
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Switch
                                        className={"cursor-pointer"}
                                        checked={nameInStats}
                                        onCheckedChange={handlerChangeNameInStats}
                                    />
                                </div>
                            </div>
                            {edited && (
                                <div className={"mt-2 text-sm" + (text.split("-")[0] === "success" ? " text-green-600" : " text-red-600")}>
                                    {text.split("-")[1]}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">Mon Profil</p>
                                <p className="text-sm text-muted-foreground">Voir et modifier mes informations</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push("/profile")} className={"cursor-pointer"}>
                                Voir
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy & Security */}
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Confidentialité & Sécurité</CardTitle>
                                <CardDescription>Tes données et ta vie privée</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">Politique de confidentialité</p>
                                <p className="text-sm text-muted-foreground">Comment nous utilisons tes données</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push("/privacy")} className={"cursor-pointer"}>
                                Lire
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">Conditions d&apos;utilisation</p>
                                <p className="text-sm text-muted-foreground">Les règles d&apos;utilisation du service</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push("/terms")} className={"cursor-pointer"}>
                                Lire
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-2 border-red-500/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-500/10">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <CardTitle className="text-red-500">Zone de danger</CardTitle>
                                <CardDescription>Actions irréversibles sur ton compte</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <div>
                                <p className="font-medium">Se déconnecter</p>
                                <p className="text-sm text-muted-foreground">Tu pourras te reconnecter à tout moment</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Déconnexion
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <div>
                                <p className="font-medium">Supprimer mon compte</p>
                                <p className="text-sm text-muted-foreground">Toutes tes données seront supprimées définitivement</p>
                            </div>
                            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className={"cursor-pointer"}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-red-500">
                                            <AlertTriangle className="h-5 w-5" />
                                            Supprimer ton compte ?
                                        </DialogTitle>
                                        <DialogDescription className="pt-4 space-y-2">
                                            <p>Cette action est <strong>irréversible</strong>. Toutes tes données seront supprimées :</p>
                                            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                                                <li>Ton profil et tes informations personnelles</li>
                                                <li>Toutes tes notes enregistrées</li>
                                                <li>Ton historique et tes statistiques</li>
                                            </ul>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            variant="outline"
                                            onClick={() => setDeleteDialogOpen(false)}
                                            className={"cursor-pointer"}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className={"cursor-pointer"}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Suppression...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Supprimer définitivement
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
