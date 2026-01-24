"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* 404 Number */}
                <div className="relative">
                    <h1 className="text-9xl md:text-[12rem] font-bold text-primary/20 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="h-20 w-20 md:h-24 md:w-24 text-primary animate-pulse" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Oups, page introuvable ! 🤔
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        Cette page n&apos;existe pas (ou elle a séché les cours).
                    </p>
                </div>

                {/* Suggestions Card */}
                <Card className="border-2 border-primary/20">
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Tu peux essayer de :
                        </p>
                        <ul className="text-sm text-left space-y-2 max-w-md mx-auto">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Vérifier l&apos;URL que vous avez saisie</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Retourner à la page d&apos;accueil</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>Utiliser le menu de navigation</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button size="lg" asChild className="gap-2">
                        <Link href="/">
                            <Home className="h-5 w-5" />
                            Retour à l&apos;accueil
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => window.history.back()} className="gap-2 cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                        Page précédente
                    </Button>
                </div>

                {/* Help text */}
                <p className="text-sm text-muted-foreground">
                    Besoin d&apos;aide ?{" "}
                    <a href="mailto:donatien.faraut@efrei.net" className="text-primary hover:underline">
                        Contactez-nous
                    </a>
                </p>
            </div>
        </div>
    );
}
