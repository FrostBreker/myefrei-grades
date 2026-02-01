"use client";

import {useState, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {User, ArrowRight, Loader2, Sparkles, Check} from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const profileLoadedRef = useRef(false);

    // User profile info
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [studentNumber, setStudentNumber] = useState("");
    const [nameInStats, setNameInStats] = useState(false);


    // Validation errors
    const [firstNameError, setFirstNameError] = useState("");
    const [lastNameError, setLastNameError] = useState("");
    const [studentNumberError, setStudentNumberError] = useState("");

    // Validation states (for green checkmarks)
    const [firstNameValid, setFirstNameValid] = useState(false);
    const [lastNameValid, setLastNameValid] = useState(false);
    const [studentNumberValid, setStudentNumberValid] = useState(false);

    // Regex pour les noms (lettres, accents, tirets, apostrophes, espaces)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

    // Formater le prénom (première lettre en majuscule)
    const formatFirstName = (value: string): string => {
        return value
            .split(/[\s-]+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(value.includes('-') ? '-' : ' ');
    };

    // Formater le nom de famille (tout en majuscule)
    const formatLastName = (value: string): string => {
        return value.toUpperCase();
    };

    // Validation du prénom
    const validateFirstName = (value: string): boolean => {
        const trimmed = value.trim();
        if (!trimmed) {
            setFirstNameError("Le prénom est requis");
            setFirstNameValid(false);
            return false;
        }
        if (trimmed.length < 2) {
            setFirstNameError("Le prénom doit contenir au moins 2 caractères");
            setFirstNameValid(false);
            return false;
        }
        if (trimmed.length > 50) {
            setFirstNameError("Le prénom ne peut pas dépasser 50 caractères");
            setFirstNameValid(false);
            return false;
        }
        if (!nameRegex.test(trimmed)) {
            setFirstNameError("Le prénom ne peut contenir que des lettres, tirets et apostrophes");
            setFirstNameValid(false);
            return false;
        }
        setFirstNameError("");
        setFirstNameValid(true);
        return true;
    };

    // Validation du nom
    const validateLastName = (value: string): boolean => {
        const trimmed = value.trim();
        if (!trimmed) {
            setLastNameError("Le nom est requis");
            setLastNameValid(false);
            return false;
        }
        if (trimmed.length < 2) {
            setLastNameError("Le nom doit contenir au moins 2 caractères");
            setLastNameValid(false);
            return false;
        }
        if (trimmed.length > 50) {
            setLastNameError("Le nom ne peut pas dépasser 50 caractères");
            setLastNameValid(false);
            return false;
        }
        if (!nameRegex.test(trimmed)) {
            setLastNameError("Le nom ne peut contenir que des lettres, tirets et apostrophes");
            setLastNameValid(false);
            return false;
        }
        setLastNameError("");
        setLastNameValid(true);
        return true;
    };

    // Validation du numéro étudiant (exactement 8 chiffres, commence par une année valide)
    const validateStudentNumber = (value: string): boolean => {
        const trimmed = value.trim();
        if (!trimmed) {
            setStudentNumberError("Le numéro étudiant est requis");
            setStudentNumberValid(false);
            return false;
        }
        // Vérifier que c'est uniquement des chiffres
        if (!/^\d+$/.test(trimmed)) {
            setStudentNumberError("Le numéro étudiant ne doit contenir que des chiffres");
            setStudentNumberValid(false);
            return false;
        }
        // Vérifier la longueur exacte de 8 chiffres
        if (trimmed.length !== 8) {
            setStudentNumberError("Le numéro étudiant doit contenir exactement 8 chiffres");
            setStudentNumberValid(false);
            return false;
        }
        // Vérifier l'année
        const yearStr = trimmed.substring(0, 4);
        const year = parseInt(yearStr, 10);
        const currentYear = new Date().getFullYear();
        if (year < 2000 || year > currentYear + 1) {
            setStudentNumberError(`L'année doit être entre 2000 et ${currentYear + 1}`);
            setStudentNumberValid(false);
            return false;
        }
        setStudentNumberError("");
        setStudentNumberValid(true);
        return true;
    };

    // Gérer la saisie du prénom
    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Filtrer les caractères non autorisés
        const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
        setFirstName(filtered);
        if (firstNameError) validateFirstName(filtered);
    };

    // Gérer la saisie du nom
    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Filtrer les caractères non autorisés
        const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
        setLastName(filtered);
        if (lastNameError) validateLastName(filtered);
    };

    // Gérer la saisie du numéro étudiant (uniquement chiffres)
    const handleStudentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Filtrer pour ne garder que les chiffres, max 8
        const filtered = value.replace(/\D/g, '').slice(0, 8);
        setStudentNumber(filtered);
        if (studentNumberError) validateStudentNumber(filtered);
    };

    // Gérer le checkbox nameInStats
    const handleNameInStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNameInStats(e.target.checked);
    };

    // Formater le nom au blur
    const handleFirstNameBlur = () => {
        if (firstName.trim()) {
            setFirstName(formatFirstName(firstName));
        }
        validateFirstName(firstName);
    };

    const handleLastNameBlur = () => {
        if (lastName.trim()) {
            setLastName(formatLastName(lastName));
        }
        validateLastName(lastName);
    };

    // Check if user already has profile info on mount
    useEffect(() => {
        if (profileLoadedRef.current) return;
        profileLoadedRef.current = true;

        const checkProfile = async () => {
            try {
                const response = await fetch("/api/user/profile");
                const data = await response.json();

                // Si l'utilisateur a déjà toutes ses infos, rediriger vers setup ou grades
                if (data.firstName && data.lastName && data.studentNumber && data.nameInStats) {
                    router.push("/setup");
                    return;
                }

                // Pré-remplir les champs existants
                if (data.firstName) setFirstName(data.firstName);
                if (data.lastName) setLastName(data.lastName);
                if (data.studentNumber) setStudentNumber(data.studentNumber);
                if (data.nameInStats) setNameInStats(data.nameInStats);
            } catch (error) {
                console.error("Error checking profile:", error);
            } finally {
                setCheckingProfile(false);
            }
        };

        checkProfile();
    }, [router]);

    const handleSubmit = async () => {
        // Valider tous les champs
        const isFirstNameValid = validateFirstName(firstName);
        const isLastNameValid = validateLastName(lastName);
        const isStudentNumberValid = validateStudentNumber(studentNumber);

        if (!isFirstNameValid || !isLastNameValid || !isStudentNumberValid) return;

        setLoading(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    firstName: formatFirstName(firstName.trim()),
                    lastName: formatLastName(lastName.trim()),
                    studentNumber: studentNumber.trim(),
                    nameInStats: nameInStats
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                // Rediriger vers la page de setup du cursus
                router.push("/setup");
            } else {
                setStudentNumberError(data.error || "Erreur lors de la sauvegarde");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Erreur lors de la sauvegarde du profil");
        } finally {
            setLoading(false);
        }
    };

    if (checkingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted py-8 md:py-12">
            <div className="px-4 sm:px-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-12">
                    <div className="flex justify-center">
                        <div className="relative">
                            <User className="h-12 w-12 md:h-16 md:w-16 text-primary"/>
                            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 absolute -top-1 -right-1"/>
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                        Bienvenue ! 👋
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-2">
                        Avant de commencer, dis-nous en un peu plus sur toi pour personnaliser ton expérience.
                    </p>
                </div>

                {/* Form Card */}
                <Card className="border-2 border-primary/20">
                    <CardHeader className="px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0"/>
                            <div>
                                <CardTitle className="text-lg md:text-xl">Tes informations</CardTitle>
                                <CardDescription className="text-sm">
                                    Ces informations nous permettront de mieux te connaître.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 md:space-y-6 px-4 sm:px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom</Label>
                                <div className="relative">
                                    <Input
                                        id="firstName"
                                        placeholder="Ton prénom"
                                        value={firstName}
                                        onChange={handleFirstNameChange}
                                        onBlur={handleFirstNameBlur}
                                        maxLength={50}
                                        className={`h-11 pr-10 ${firstNameError ? "border-red-500" : firstNameValid ? "border-green-500" : ""}`}
                                    />
                                    {firstNameValid && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                                    )}
                                </div>
                                {firstNameError && (
                                    <p className="text-xs text-red-500">{firstNameError}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Nom</Label>
                                <div className="relative">
                                    <Input
                                        id="lastName"
                                        placeholder="Ton nom"
                                        value={lastName}
                                        onChange={handleLastNameChange}
                                        onBlur={handleLastNameBlur}
                                        maxLength={50}
                                        className={`h-11 pr-10 ${lastNameError ? "border-red-500" : lastNameValid ? "border-green-500" : ""}`}
                                    />
                                    {lastNameValid && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                                    )}
                                </div>
                                {lastNameError && (
                                    <p className="text-xs text-red-500">{lastNameError}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="studentNumber">Numéro étudiant</Label>
                            <div className="relative">
                                <Input
                                    id="studentNumber"
                                    placeholder="Ex: 20250000"
                                    inputMode="numeric"
                                    value={studentNumber}
                                    onChange={handleStudentNumberChange}
                                    onBlur={() => validateStudentNumber(studentNumber)}
                                    maxLength={8}
                                    className={`h-11 pr-10 ${studentNumberError ? "border-red-500" : studentNumberValid ? "border-green-500" : ""}`}
                                />
                                {studentNumberValid && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                                )}
                            </div>
                            {studentNumberError ? (
                                <p className="text-xs text-red-500">{studentNumberError}</p>
                            ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Ton numéro étudiant EFREI à 8 chiffres (ex: 20250001).
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="nameInStats"
                                type="checkbox"
                                checked={nameInStats}
                                onChange={handleNameInStatsChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="nameInStats" className="text-sm select-none">
                                Autoriser l&#39;affichage de mon nom dans les statistiques de classement
                            </Label>
                        </div>
                        <Button
                            size="lg"
                            className="w-full mt-4 md:mt-6 h-12 cursor-pointer"
                            disabled={!firstName.trim() || !lastName.trim() || !studentNumber.trim() || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    Continuer
                                    <ArrowRight className="ml-2 h-5 w-5"/>
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
