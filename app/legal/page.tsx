import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Building2, User, Mail, Globe, Server } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mentions Légales - MyEFREI Grades",
    description: "Informations légales concernant MyEFREI Grades.",
};

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-background py-12">
            <div className="px-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <div className="flex justify-center">
                        <Scale className="h-16 w-16 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Mentions Légales
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Les trucs légaux obligatoires (promis c&apos;est pas trop long)
                    </p>
                </div>

                {/* Introduction */}
                <Card className="mb-8 border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>En bref</CardTitle>
                        <CardDescription>
                            Qui je suis et où est hébergé le site
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            MyEFREI Grades est un projet étudiant créé pour simplifier la vie des étudiants EFREI.
                            Voici les infos légales obligatoires pour être en règle ! 📝
                        </p>
                    </CardContent>
                </Card>

                {/* Éditeur */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl">Le créateur</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Projet</p>
                                <p className="font-medium">MyEFREI Grades</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <p className="font-medium">Projet étudiant gratuit</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 mb-2">
                                <Mail className="h-4 w-4 text-primary" />
                                <p className="text-sm text-muted-foreground">Contact</p>
                            </div>
                            <p className="font-medium">donatien.faraut@efrei.net</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Hébergement */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Server className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl">Où est hébergé le site ?</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-muted-foreground">
                            Le site tourne sur un serveur que je loue :
                        </p>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Hébergeur :</span> Contabo GmbH</p>
                            <p><span className="font-medium">Adresse :</span> Aschauer Straße 32a, 81549 München, Allemagne</p>
                            <p><span className="font-medium">Site web :</span> <a href="https://contabo.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">contabo.com</a></p>
                        </div>
                        <div className="pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                                Les données sont stockées sur mon serveur VPS avec une base MongoDB que je gère moi-même.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* EFREI */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl">Mon école</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-muted-foreground">
                            Je suis étudiant à :
                        </p>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">École :</span> EFREI Paris</p>
                            <p><span className="font-medium">Adresse :</span> 30-32 Avenue de la République, 94800 Villejuif</p>
                            <p><span className="font-medium">Site web :</span> <a href="https://www.efrei.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">efrei.fr</a></p>
                        </div>
                        <div className="pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                                ⚠️ <strong>Important :</strong> MyEFREI Grades est un projet perso, pas un service officiel de l&apos;EFREI !
                                L&apos;école n&apos;a rien à voir avec ce site.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Propriété intellectuelle */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl">Propriété intellectuelle</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            L&apos;ensemble de ce site relève de la législation française et internationale sur le droit
                            d&apos;auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés,
                            y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                        </p>
                        <div className="space-y-2 text-sm">
                            <p><strong>Technologies utilisées :</strong></p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Next.js - Framework React</li>
                                <li>Tailwind CSS - Framework CSS</li>
                                <li>shadcn/ui - Bibliothèque de composants</li>
                                <li>Lucide React - Icônes</li>
                                <li>NextAuth.js - Authentification</li>
                                <li>MongoDB - Base de données</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Protection des données */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Tes données personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Tu as le droit de voir, modifier ou supprimer tes données quand tu veux (c&apos;est la loi RGPD).
                        </p>
                        <p>
                            Pour ça, envoie-moi juste un mail à : <strong>donatien.faraut@efrei.net</strong>
                        </p>
                        <p className="text-sm">
                            Plus de détails dans la{" "}
                            <a href="/privacy" className="text-primary hover:underline">Politique de Confidentialité</a>.
                        </p>
                    </CardContent>
                </Card>

                {/* Cookies */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Cookies</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Le site utilise des cookies pour que tu restes connecté et que ton expérience soit fluide.
                        </p>
                        <p>
                            Pas de tracking, pas de pub. Juste ce qui est nécessaire pour que le site fonctionne ! 🍪
                        </p>
                    </CardContent>
                </Card>

                {/* Liens externes */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Liens vers d&apos;autres sites</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Le site peut contenir des liens vers d&apos;autres sites. Je ne contrôle pas leur contenu,
                            donc je ne peux pas être responsable de ce qu&apos;ils affichent.
                        </p>
                        <p>
                            Tu peux créer un lien vers MyEFREI Grades sans problème, tant que ça reste correct !
                        </p>
                    </CardContent>
                </Card>

                {/* Crédits */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Crédits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p><strong>Conception et développement :</strong> Projet étudiant EFREI</p>
                        <p><strong>Design :</strong> shadcn/ui, Tailwind CSS</p>
                        <p><strong>Icônes :</strong> Lucide React</p>
                        <p><strong>Polices :</strong> Geist Sans & Geist Mono (Vercel)</p>
                    </CardContent>
                </Card>

                {/* Droit applicable */}
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>Droit applicable</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Les présentes mentions légales sont régies par le droit français.
                        </p>
                        <p>
                            En cas de litige et à défaut d&apos;accord amiable, le litige sera porté devant
                            les tribunaux français compétents.
                        </p>
                    </CardContent>
                </Card>

                {/* Date de mise à jour */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Dernière mise à jour : 24 janvier 2026</p>
                </div>
            </div>
        </div>
    );
}
