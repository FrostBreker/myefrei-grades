"use client";
import {User} from "@lib/user/getUserBySession";
import {useSession, signIn} from "next-auth/react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
    GraduationCap,
    TrendingUp,
    BarChart3,
    FileText,
    Clock,
    Shield,
    Zap,
    CheckCircle2,
    ArrowRight
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HomePage({initialUserData}: { initialUserData: User | null }) {
    const {data: session, status} = useSession();

    const features = [
        {
            icon: FileText,
            title: "Tes notes, enfin organisées",
            description: "Toutes tes notes en un seul endroit. Plus besoin de chercher partout !",
            color: "text-blue-600"
        },
        {
            icon: TrendingUp,
            title: "Suis ta progression",
            description: "Des graphiques sympas pour voir comment tu progresses au fil du temps.",
            color: "text-green-600"
        },
        {
            icon: BarChart3,
            title: "Stats détaillées",
            description: "Tes moyennes, tes meilleures matières... Tout ce dont tu as besoin.",
            color: "text-purple-600"
        },
        {
            icon: Clock,
            title: "Historique complet",
            description: "Toutes tes notes depuis le début. Nostalgie du premier semestre ? 😅",
            color: "text-orange-600"
        },
        {
            icon: Shield,
            title: "Sécurisé et privé",
            description: "Tes données restent tes données. Personne d'autre n'y a accès.",
            color: "text-red-600"
        },
        {
            icon: Zap,
            title: "Rapide et simple",
            description: "Pas de trucs compliqués. Juste une interface claire et efficace.",
            color: "text-yellow-600"
        }
    ];

    const stats = [
        {value: "100%", label: "Fait maison (Pas république)"},
        {value: "0€", label: "Gratuit"},
        {value: "24/7", label: "Dispo"}
    ];

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted">
            {/* Hero Section */}
            <section className="px-4 py-20 md:py-32">
                <div className="flex flex-col items-center text-center space-y-8">
                    <Badge variant="secondary" className="px-4 py-2 text-sm">
                        <GraduationCap className="h-4 w-4 mr-2 inline" />
                        Fait par un étudiant, pour les étudiants
                    </Badge>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
                        Tes notes EFREI,
                        <span className="text-primary"> enfin claires </span>
                        et accessibles
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                        Plus besoin de jongler entre plusieurs onglets. Toutes tes notes au même endroit,
                        avec des stats sympas pour voir comment tu t&apos;en sors ! 📊
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        {status === "loading" ? (
                            <Button size="lg" disabled className="text-lg px-8 py-6">
                                Chargement...
                            </Button>
                        ) : session ? (
                            <Button size="lg" asChild className="text-lg px-8 py-6">
                                <Link href="/grades">
                                    C&apos;est parti ! 🚀
                                    <ArrowRight className="ml-2 h-5 w-5"/>
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                onClick={() => signIn("google")}
                                className="text-lg px-8 py-6 cursor-pointer"
                            >
                                Connexion avec Google
                                <ArrowRight className="ml-2 h-5 w-5"/>
                            </Button>
                        )}
                        <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                            <Link href="#features">
                                Comment ça marche ?
                            </Link>
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 pt-12 w-full max-w-2xl">
                        {stats.map((stat, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="text-3xl md:text-4xl font-bold text-primary">
                                    {stat.value}
                                </div>
                                <div className="text-sm md:text-base text-muted-foreground mt-1">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="px-4 py-20 bg-background/50">
                <div className="text-center space-y-4 mb-16">
                    <Badge variant="outline" className="px-4 py-2">
                        Les trucs cool
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Ce que tu peux faire
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Tout ce qu&apos;il te faut pour suivre tes résultats sans prise de tête
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 ${feature.color}`}>
                                        <Icon className="h-6 w-6"/>
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    <CardDescription className="text-base">
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Benefits Section */}
            <section className="px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    <Card className="border-2 border-primary/20">
                        <CardContent className="p-8 md:p-12">
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-6">
                                    <Badge className="px-4 py-2">
                                        Pourquoi ce projet ?
                                    </Badge>
                                    <h3 className="text-3xl md:text-4xl font-bold">
                                        Fait par un étudiant qui en avait marre
                                    </h3>
                                    <p className="text-muted-foreground text-lg">
                                        J&apos;en avais assez de galérer pour trouver mes notes et faire mes calculs de moyenne.
                                        Alors j&apos;ai créé ce site. Simple, rapide, et gratuit ! 🎓
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        "Interface simple, pas de trucs compliqués",
                                        "Tes données restent privées",
                                        "Stats automatiques (fini les calculs Excel !)",
                                        "Marche sur ton téléphone aussi",
                                        "100% gratuit, évidemment"
                                    ].map((benefit, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5"/>
                                            <span className="text-lg">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            {!session && status !== "loading" && (
                <section className="px-4 py-20">
                    <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground border-0">
                        <CardContent className="p-8 md:p-12 text-center space-y-6">
                            <h3 className="text-3xl md:text-4xl font-bold">
                                Allez, teste ! 🚀
                            </h3>
                            <p className="text-lg opacity-90 max-w-2xl mx-auto">
                                Connecte-toi avec ton compte Google et découvre toutes tes notes en un coup d&apos;œil.
                                Promis, c&apos;est rapide !
                            </p>
                            <Button
                                size="lg"
                                variant="secondary"
                                onClick={() => signIn("google")}
                                className="text-lg px-8 py-6 cursor-pointer"
                            >
                                Connexion avec Google
                                <ArrowRight className="ml-2 h-5 w-5"/>
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Welcome back section for authenticated users */}
            {session && (
                <section className="px-4 py-20">
                    <Card className="max-w-4xl mx-auto border-2 border-primary/20">
                        <CardContent className="p-8 md:p-12 text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <GraduationCap className="h-8 w-8 text-primary"/>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold">
                                Salut {session.user?.email?.split("@")[0]} ! 👋
                            </h3>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Content de te revoir ! Va voir tes notes et tes stats mises à jour.
                            </p>
                            <Button size="lg" asChild className="text-lg px-8 py-6">
                                <Link href="/grades">
                                    Voir mes notes
                                    <ArrowRight className="ml-2 h-5 w-5"/>
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}

export default HomePage;