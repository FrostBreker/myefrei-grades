import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from "lucide-react";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Confidentialité - MyEFREI Grades",
    description: "Comment je protège tes données personnelles. Simple et transparent.",
};

export default function PrivacyPage() {
    const sections = [
        {
            icon: Database,
            title: "Ce que je collecte",
            content: [
                "Je collecte juste ce qui est nécessaire :",
                "• Ton adresse email (via Google)",
                "• Ta photo de profil (si tu en as une)",
                "• Ton adresse IP (pour la sécurité)",
                "• Les dates de connexion"
            ]
        },
        {
            icon: Lock,
            title: "Comment j'utilise tes données",
            content: [
                "Tes données servent uniquement à :",
                "• Te connecter et sécuriser ton compte",
                "• Afficher tes notes",
                "• Améliorer le site",
                "• Protéger le service",
                "",
                "Je ne vends JAMAIS tes données. Promis."
            ]
        },
        {
            icon: Shield,
            title: "Comment je protège tes données",
            content: [
                "Mesures de sécurité en place :",
                "• Chiffrement SSL/TLS partout",
                "• Base de données MongoDB sécurisée",
                "• Authentification Google OAuth 2.0",
                "• Accès restreint aux données",
                "• Surveillance constante"
            ]
        },
        {
            icon: Eye,
            title: "Partage des données",
            content: [
                "Tes données ne sont JAMAIS partagées, sauf :",
                "• Si la loi l'oblige (décision de justice)",
                "• Pour protéger mes droits légaux",
                "• Si tu me donnes ton accord explicite",
                "",
                "Pas de partage avec des entreprises tierces. Point."
            ]
        },
        {
            icon: UserCheck,
            title: "Tes droits (RGPD)",
            content: [
                "Tu as le droit de :",
                "• Accéder à tes données",
                "• Les corriger si elles sont fausses",
                "• Les supprimer (droit à l'oubli)",
                "• Les récupérer (portabilité)",
                "• T'opposer au traitement",
                "",
                "Pour ça, écris-moi : donatien.faraut@efrei.net"
            ]
        },
        {
            icon: AlertCircle,
            title: "Cookies",
            content: [
                "J'utilise des cookies uniquement pour :",
                "• Garder ta session active",
                "• Mémoriser tes préférences",
                "• Sécuriser ton compte",
                "",
                "Pas de tracking pub, rien de tout ça.",
                "Tu peux les désactiver dans ton navigateur, mais le site marchera moins bien."
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="px-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <div className="flex justify-center">
                        <Shield className="h-16 w-16 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Vie Privée & Données
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Dernière mise à jour : 24 janvier 2026
                    </p>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Comment je gère tes données. Transparent, simple, sans langue de bois. 🔒
                    </p>
                </div>

                {/* Introduction Card */}
                <Card className="mb-8 border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>Mon engagement</CardTitle>
                        <CardDescription>
                            Respect de ta vie privée avant tout
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            MyEFREI Grades est fait pour les étudiants EFREI. Je prends tes données au sérieux
                            et je respecte ta vie privée conformément au RGPD (la loi européenne sur la protection des données).
                        </p>
                        <p>
                            Cette page t&apos;explique clairement ce que je collecte, pourquoi, et comment je protège tout ça.
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

                {/* Conservation des données */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Combien de temps je garde tes données</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Je garde tes données tant que tu utilises le site.
                        </p>
                        <p>
                            Si tu supprimes ton compte, j&apos;efface tout dans les 30 jours max
                            (sauf si la loi m&apos;oblige à garder certaines infos).
                        </p>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="mt-6 border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>Des questions ?</CardTitle>
                        <CardDescription>
                            N&apos;hésite pas à me contacter
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Pour toute question sur cette politique ou pour exercer tes droits,
                            écris-moi à :
                        </p>
                        <div className="space-y-2">
                            <p className="font-medium">Email : donatien.faraut@efrei.net</p>
                            <p className="text-sm text-muted-foreground">
                                Je te réponds sous 30 jours max (souvent bien plus vite !).
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Modifications */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Modifications de cette politique</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>
                            Je peux modifier cette politique de temps en temps si nécessaire.
                        </p>
                        <p>
                            Si je change un truc important, je t&apos;enverrai un mail ou une notif sur le site.
                            Pense à vérifier cette page de temps en temps !
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
