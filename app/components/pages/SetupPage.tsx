"use client";

import {useState, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {GraduationCap, ArrowRight, Loader2} from "lucide-react";
import {Cursus, Filiere, Groupe} from "@lib/grades/types";

// Helper functions to get display labels
const getCursusLabel = (cursus: string) => {
    const labels: Record<string, { label: string; description: string }> = {
        PGE: {
            label: "PGE (Programme Grande École)",
            description: "Programmes Grande École"
        },
        PEX: {
            label: "PEX (Programmes Experts)",
            description: "Programmes Expert du Numérique"
        }
    };
    return labels[cursus] || {label: cursus, description: ""};
};

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const cursusLoadedRef = useRef(false);
    const profileLoadedRef = useRef(false);

    // User info for display
    const [userName, setUserName] = useState("");

    // Available options from DB
    const [availableCursus, setAvailableCursus] = useState<string[]>([]);
    const [availableFilieres, setAvailableFilieres] = useState<string[]>([]);
    const [availableGroupes, setAvailableGroupes] = useState<string[]>([]);

    // Selected values
    const [cursus, setCursus] = useState<Cursus | null>(null);
    const [filiere, setFiliere] = useState<Filiere | null>(null);
    const [groupe, setGroupe] = useState<Groupe | null>(null);

    // Check if user already has an academic profile - redirect to grades if so
    useEffect(() => {
        const checkExistingProfile = async () => {
            try {
                const response = await fetch("/api/grades/setup-profile");
                const data = await response.json();

                if (data.exists) {
                    // User already has a profile, redirect to grades
                    router.push("/grades");
                    return;
                }
            } catch (error) {
                console.error("Error checking profile:", error);
            } finally {
                setCheckingProfile(false);
            }
        };

        checkExistingProfile();
    }, [router]);

    // Load user name for display
    useEffect(() => {
        if (profileLoadedRef.current) return;
        profileLoadedRef.current = true;

        const loadProfile = async () => {
            try {
                const response = await fetch("/api/user/profile");
                const data = await response.json();
                if (data.firstName && data.lastName) {
                    setUserName(`${data.firstName} ${data.lastName}`);
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            }
        };

        loadProfile();
    }, []);

    // Load available cursus on mount (once only)
    useEffect(() => {
        if (cursusLoadedRef.current) return;
        cursusLoadedRef.current = true;

        const loadCursus = async () => {
            try {
                const response = await fetch("/api/grades/cursus");
                const data = await response.json();
                if (data.success) {
                    setAvailableCursus(data.cursus);
                }
            } catch (error) {
                console.error("Error loading cursus:", error);
            }
        };

        loadCursus();
    }, []);

    // Load available filieres when cursus changes
    useEffect(() => {
        if (!cursus) return;

        let isMounted = true;

        const loadFilieres = async () => {
            try {
                const response = await fetch(`/api/grades/filieres?cursus=${cursus}`);
                const data = await response.json();
                if (isMounted && data.success) {
                    setAvailableFilieres(data.filieres);
                }
            } catch (error) {
                console.error("Error loading filieres:", error);
            }
        };

        loadFilieres();

        return () => {
            isMounted = false;
        };
    }, [cursus]);

    // Load available groupes when filiere changes
    useEffect(() => {
        if (!cursus || !filiere) return;

        let isMounted = true;

        const loadGroupes = async () => {
            try {
                const response = await fetch(`/api/grades/groupes?cursus=${cursus}&filiere=${filiere}`);
                const data = await response.json();
                if (isMounted && data.success) {
                    setAvailableGroupes(data.groupes);
                }
            } catch (error) {
                console.error("Error loading groupes:", error);
            }
        };

        loadGroupes();

        return () => {
            isMounted = false;
        };
    }, [cursus, filiere]);

    const handleCursusChange = (newCursus: Cursus) => {
        setCursus(newCursus);
        // Reset dependent selections
        setFiliere(null);
        setGroupe(null);
        setAvailableFilieres([]);
        setAvailableGroupes([]);
    };

    const handleFiliereChange = (newFiliere: Filiere) => {
        setFiliere(newFiliere);
        // Reset dependent selection
        setGroupe(null);
        setAvailableGroupes([]);
    };

    const handleSubmit = async () => {
        if (!cursus || !filiere || !groupe) return;

        setLoading(true);

        try {
            const response = await fetch("/api/grades/setup-profile", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({cursus, filiere, groupe})
            });

            if (response.ok) {
                router.push("/grades");
            } else if (response.status === 409) {
                // Profile already exists, redirect to grades
                router.push("/grades");
            } else {
                throw new Error("Failed to setup profile");
            }
        } catch (error) {
            console.error("Error setting up profile:", error);
            alert("Erreur lors de la configuration du profil");
        } finally {
            setLoading(false);
        }
    };

    // Show loading screen while checking for existing profile
    if (checkingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Vérification de votre profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted py-12">
            <div className="px-4 max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <div className="flex justify-center">
                        <GraduationCap className="h-16 w-16 text-primary"/>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Configure ton cursus
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {userName ? `Bienvenue ${userName} ! ` : ""}Dis-nous où tu en es dans ton cursus ! 🎓
                    </p>
                    <div className="flex justify-center gap-2 pt-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-2 w-16 rounded-full transition-all ${
                                    s <= step ? "bg-primary" : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Step 1: Cursus */}
                {step === 1 && (
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle>Étape 1 : Ton cursus</CardTitle>
                            <CardDescription>
                                Quel type de formation suis-tu à l&apos;EFREI ?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {availableCursus.length === 0 ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"/>
                                    <p className="text-muted-foreground">Chargement des cursus disponibles...</p>
                                </div>
                            ) : (
                                availableCursus.map((c) => {
                                    const cursusInfo = getCursusLabel(c);
                                    return (
                                        <Card
                                            key={c}
                                            className={`cursor-pointer transition-all hover:shadow-lg ${
                                                cursus === c
                                                    ? "border-2 border-primary bg-primary/5"
                                                    : "border-2 border-transparent"
                                            }`}
                                            onClick={() => handleCursusChange(c as Cursus)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-lg mb-1">{cursusInfo.label}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {cursusInfo.description}
                                                        </p>
                                                    </div>
                                                    {cursus === c && (
                                                        <Badge className="ml-4">Sélectionné</Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                            <Button
                                size="lg"
                                className="w-full mt-6"
                                disabled={!cursus}
                                onClick={() => setStep(2)}
                            >
                                Continuer
                                <ArrowRight className="ml-2 h-5 w-5"/>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Filiere */}
                {step === 2 && (
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle>Étape 2 : Ton niveau</CardTitle>
                            <CardDescription>
                                En quelle année es-tu actuellement ?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {availableFilieres.length === 0 ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"/>
                                    <p className="text-muted-foreground">Chargement des filières disponibles...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {availableFilieres.map((f) => (
                                        <Card
                                            key={f}
                                            className={`cursor-pointer transition-all hover:shadow-lg ${
                                                filiere === f
                                                    ? "border-2 border-primary bg-primary/5"
                                                    : "border-2 border-transparent"
                                            }`}
                                            onClick={() => handleFiliereChange(f as Filiere)}
                                        >
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <p className="font-medium">{f}</p>
                                                {filiere === f && (
                                                    <Badge>Sélectionné</Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep(1)}
                                >
                                    Retour
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1"
                                    disabled={!filiere}
                                    onClick={() => setStep(3)}
                                >
                                    Continuer
                                    <ArrowRight className="ml-2 h-5 w-5"/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Groupe */}
                {step === 3 && (
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle>Étape 3 : Ton groupe/parcours</CardTitle>
                            <CardDescription>
                                Quel est ton parcours ou groupe ?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {availableGroupes.length === 0 ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"/>
                                    <p className="text-muted-foreground">Chargement des groupes disponibles...</p>
                                </div>
                            ) : (
                                availableGroupes.map((g) => {
                                    return (
                                        <Card
                                            key={g}
                                            className={`cursor-pointer transition-all hover:shadow-lg ${
                                                groupe === g
                                                    ? "border-2 border-primary bg-primary/5"
                                                    : "border-2 border-transparent"
                                            }`}
                                            onClick={() => setGroupe(g as Groupe)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-lg mb-1">{g}</h3>
                                                    </div>
                                                    {groupe === g && (
                                                        <Badge className="ml-4">Sélectionné</Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep(2)}
                                >
                                    Retour
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1"
                                    disabled={!groupe || loading}
                                    onClick={handleSubmit}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                            Configuration...
                                        </>
                                    ) : (
                                        <>
                                            Valider
                                            <ArrowRight className="ml-2 h-5 w-5"/>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Summary */}
                {(cursus || filiere || groupe) && (
                    <Card className="mt-6 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-sm">Récapitulatif</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {cursus && <Badge variant="secondary">Cursus: {cursus}</Badge>}
                            {filiere && <Badge variant="secondary">Niveau: {filiere}</Badge>}
                            {groupe && <Badge variant="secondary">Groupe: {groupe}</Badge>}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
