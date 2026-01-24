import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle2, XCircle, AlertTriangle, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Conditions d'Utilisation - MyEFREI Grades",
    description: "Les règles du jeu pour utiliser le site. Simple et clair.",
};

export default function TermsPage() {
    const sections = [
        {
            icon: CheckCircle2,
            title: "En utilisant le site",
            content: [
                "En utilisant MyEFREI Grades, tu acceptes ces conditions.",
                "",
                "Si tu n'es pas d'accord, n'utilise pas le site (mais promis, c'est raisonnable).",
                "",
                "Si je modifie ces conditions, continuer à utiliser le site = tu les acceptes."
            ]
        },
        {
            icon: FileText,
            title: "C'est quoi ce site ?",
            content: [
                "MyEFREI Grades, c'est un site pour les étudiants EFREI qui permet de :",
                "• Voir tes notes et résultats",
                "• Regarder des stats sympas",
                "• Suivre ta progression",
                "",
                "C'est gratuit et je fais de mon mieux pour que ça marche tout le temps (mais je garantis rien)."
            ]
        },
        {
            icon: Scale,
            title: "Ce que tu dois faire",
            content: [
                "En utilisant le site, tu t'engages à :",
                "• Donner des vraies infos quand tu te connectes",
                "• Garder ton compte pour toi",
                "• Pas partager tes identifiants",
                "• Utiliser le site normalement",
                "• Pas essayer de hacker le truc",
                "• Respecter le travail que j'ai mis dedans",
                "",
                "Si tu fais n'importe quoi, je peux bloquer ton compte."
            ]
        },
        {
            icon: AlertTriangle,
            title: "Limitations (soyons honnêtes)",
            content: [
                "Le site est fourni \"tel quel\" :",
                "• Je ne garantis pas que les données soient parfaites à 100%",
                "• Je ne suis pas responsable des décisions que tu prends avec les infos",
                "• Le site peut être down pour maintenance",
                "• Je peux modifier ou arrêter le service",
                "",
                "Les données officielles de l'EFREI font toujours foi !"
            ]
        },
        {
            icon: XCircle,
            title: "Ce qui est interdit",
            content: [
                "Tu ne dois PAS :",
                "• Essayer d'accéder aux données des autres",
                "• Utiliser des bots ou scripts automatiques",
                "• Surcharger le serveur",
                "• Chercher des failles de sécurité",
                "• Diffuser du contenu illégal",
                "• Te faire passer pour quelqu'un d'autre",
                "",
                "Sinon, ça peut aller très loin (plainte, etc.)."
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="px-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <div className="flex justify-center">
                        <FileText className="h-16 w-16 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Conditions d&apos;Utilisation
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Dernière mise à jour : 24 janvier 2026
                    </p>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Les règles du jeu, écrites simplement. Lis ça vite fait ! 📋
                    </p>
                </div>

                {/* Introduction */}
                <Card className="mb-8 border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>En bref</CardTitle>
                        <CardDescription>
                            Comment utiliser le site correctement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            Ces Conditions d&apos;Utilisation (CGU) expliquent comment tu peux utiliser MyEFREI Grades.
                        </p>
                        <p>
                            C&apos;est un projet perso d&apos;étudiant, pas un service officiel de l&apos;EFREI.
                            Sois cool, utilise le site normalement, et tout ira bien ! 😊
                        </p>
                    </CardContent>
                </Card>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl">{section.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-muted-foreground">
                                        {section.content.map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Propriété intellectuelle */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Propriété intellectuelle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Tous les éléments de la plateforme MyEFREI Grades (structure, design, textes, graphiques,
                            logos, icônes, sons, logiciels) sont la propriété exclusive de leurs auteurs respectifs
                            et sont protégés par les lois relatives à la propriété intellectuelle.
                        </p>
                        <p>
                            Toute reproduction, représentation, modification, publication, adaptation de tout ou partie
                            des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite,
                            sauf autorisation écrite préalable.
                        </p>
                    </CardContent>
                </Card>

                {/* Responsabilité */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Limitation de responsabilité</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            MyEFREI Grades ne peut être tenu responsable :
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Des dommages directs ou indirects causés au matériel de l&apos;utilisateur</li>
                            <li>De la perte de données ou de programmes</li>
                            <li>Des conséquences de décisions prises sur la base des informations fournies</li>
                            <li>De l&apos;utilisation frauduleuse du service par des tiers</li>
                            <li>Des interruptions temporaires du service</li>
                        </ul>
                        <p>
                            L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait du service
                            et des décisions qu&apos;il prend.
                        </p>
                    </CardContent>
                </Card>

                {/* Suspension et résiliation */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Suspension et résiliation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Nous nous réservons le droit de suspendre ou de résilier votre accès au service,
                            sans préavis ni indemnité, en cas de :
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Violation des présentes conditions d&apos;utilisation</li>
                            <li>Utilisation frauduleuse ou abusive du service</li>
                            <li>Comportement nuisible envers d&apos;autres utilisateurs</li>
                            <li>Non-respect des lois en vigueur</li>
                        </ul>
                        <p>
                            Vous pouvez à tout moment demander la suppression de votre compte en nous contactant.
                        </p>
                    </CardContent>
                </Card>

                {/* Droit applicable */}
                <Card className="mt-6 border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>Droit applicable et juridiction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Les présentes conditions d&apos;utilisation sont régies par le droit français.
                        </p>
                        <p>
                            En cas de litige, les parties s&apos;efforceront de trouver une solution amiable.
                            À défaut, le litige sera porté devant les tribunaux compétents français.
                        </p>
                    </CardContent>
                </Card>

                {/* Modifications */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Modifications des conditions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Nous nous réservons le droit de modifier ces conditions d&apos;utilisation à tout moment.
                            Les modifications prendront effet dès leur publication sur cette page.
                        </p>
                        <p>
                            Il est de votre responsabilité de consulter régulièrement ces conditions.
                            L&apos;utilisation continue du service après modification vaut acceptation des nouvelles conditions.
                        </p>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="mt-6 border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Pour toute question concernant ces conditions d&apos;utilisation :
                        </p>
                        <p className="font-medium mt-4">Email : donatien.faraut@efrei.net</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
