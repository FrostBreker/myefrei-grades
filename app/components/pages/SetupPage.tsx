"use client";

import {useState, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {
    GraduationCap,
    Loader2,
    CheckCircle2,
    BookOpen,
    Users,
    Calendar,
    Sparkles,
    ArrowRight
} from "lucide-react";
import {Cursus, Filiere, Groupe} from "@lib/grades/types";

// Helper functions to get display labels
const getCursusLabel = (cursus: string) => {
    const labels: Record<string, { label: string; description: string; icon: string }> = {
        PGE: {
            label: "Programme Grande École",
            description: "Formation d'ingénieur en 5 ans",
            icon: "🎓"
        },
        PEX: {
            label: "Programmes Experts",
            description: "Formation spécialisée du numérique",
            icon: "💻"
        }
    };
    return labels[cursus] || {label: cursus, description: "", icon: "📚"};
};

const getFiliereLabel = (filiere: string) => {
    const labels: Record<string, { label: string; year: string }> = {
        L1: {label: "Licence 1", year: "1ère année"},
        L2: {label: "Licence 2", year: "2ème année"},
        L3: {label: "Licence 3", year: "3ème année"},
        M1: {label: "Master 1", year: "4ème année"},
        M2: {label: "Master 2", year: "5ème année"},
        B1: {label: "Bachelor 1", year: "1ère année"},
        B2: {label: "Bachelor 2", year: "2ème année"},
        B3: {label: "Bachelor 3", year: "3ème année"},
    };
    return labels[filiere] || {label: filiere, year: ""};
};

export default function SetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const initialLoadRef = useRef(false);

    // User info for display
    const [userName, setUserName] = useState("");

    // Available options from DB
    const [availableCursus, setAvailableCursus] = useState<string[]>([]);
    const [availableFilieres, setAvailableFilieres] = useState<string[]>([]);
    const [availableGroupes, setAvailableGroupes] = useState<string[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);

    // Loading states
    const [loadingFilieres, setLoadingFilieres] = useState(false);
    const [loadingGroupes, setLoadingGroupes] = useState(false);
    const [loadingYears, setLoadingYears] = useState(false);

    // Selected values
    const [cursus, setCursus] = useState<Cursus | null>(null);
    const [filiere, setFiliere] = useState<Filiere | null>(null);
    const [groupe, setGroupe] = useState<Groupe | null>(null);
    const [academicYear, setAcademicYear] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>("");

    // Steps completion
    const [stepsCompleted, setStepsCompleted] = useState(0);
    const [steps, setSteps] = useState([1, 2, 3, 4]);

    // Check if user already has an academic profile
    useEffect(() => {
        const checkExistingProfile = async () => {
            try {
                const response = await fetch("/api/grades/setup-profile");
                if (!response.ok) {
                    setCheckingProfile(false);
                    return;
                }
                const data = await response.json();
                if (data.exists === true) {
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

    // Initial load: user name and cursus
    useEffect(() => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;

        const loadInitialData = async () => {
            try {
                // Load user profile
                const profileRes = await fetch("/api/user/profile");
                const profileData = await profileRes.json();
                if (profileData.firstName && profileData.lastName) {
                    setUserName(`${profileData.firstName} ${profileData.lastName}`);
                }

                // Load cursus
                const cursusRes = await fetch("/api/grades/cursus");
                const cursusData = await cursusRes.json();
                if (cursusData.success) {
                    setAvailableCursus(cursusData.cursus);
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            }
        };
        loadInitialData();
    }, []);

    // Load filieres when cursus changes
    useEffect(() => {
        if (!cursus) {
            setAvailableFilieres([]);
            return;
        }

        const loadFilieres = async () => {
            setLoadingFilieres(true);
            try {
                const response = await fetch(`/api/grades/filieres?cursus=${cursus}`);
                const data = await response.json();
                if (data.success) {
                    setAvailableFilieres(data.filieres);
                }
            } catch (error) {
                console.error("Error loading filieres:", error);
            } finally {
                setLoadingFilieres(false);
            }
        };
        loadFilieres();
    }, [cursus]);

    // Load groupes when filiere changes
    useEffect(() => {
        if (!cursus || !filiere) {
            setAvailableGroupes([]);
            return;
        }

        const loadGroupes = async () => {
            setLoadingGroupes(true);
            try {
                const response = await fetch(`/api/grades/groupes?cursus=${cursus}&filiere=${filiere}`);
                const data = await response.json();
                if (data.success) {
                    setAvailableGroupes(data.groupes);
                }
            } catch (error) {
                console.error("Error loading groupes:", error);
            } finally {
                setLoadingGroupes(false);
            }
        };
        loadGroupes();
    }, [cursus, filiere]);

    // Load academic years when groupe changes
    useEffect(() => {
        if (!cursus || !filiere || !groupe) {
            setAvailableYears([]);
            return;
        }

        const loadYears = async () => {
            setLoadingYears(true);
            try {
                const response = await fetch(
                    `/api/grades/academic-years?cursus=${cursus}&filiere=${filiere}&groupe=${groupe}`
                );
                const data = await response.json();
                if (data.success) {
                    setAvailableYears(data.academicYears);
                    // Auto-select if only one year available
                    if (data.academicYears.length === 1) {
                        setAcademicYear(data.academicYears[0]);
                    }
                }
            } catch (error) {
                console.error("Error loading years:", error);
            } finally {
                setLoadingYears(false);
            }
        };
        loadYears();
    }, [cursus, filiere, groupe]);

    // Fetch template and branches when all selections are made
    useEffect(() => {
        if (!cursus || !filiere || !groupe || !academicYear) {
            setAvailableBranches([]);
            setSelectedBranch("");
            setSteps([1, 2, 3, 4]);
            return;
        }
        const fetchTemplate = async () => {
            try {
                const res = await fetch(`/api/grades/year-template-by-path?cursus=${cursus}&filiere=${filiere}&groupe=${groupe}&academicYear=${academicYear}`);
                if (!res.ok) {
                    setAvailableBranches([]);
                    setSelectedBranch("");
                    return;
                }
                const data = await res.json();
                if (data.success && data.template && Array.isArray(data.template.branches) && data.template.branches.length > 0) {
                    setAvailableBranches(data.template.branches);
                    setSelectedBranch("");
                    setSteps([1, 2, 3, 4,5]);
                } else {
                    setAvailableBranches([]);
                    setSelectedBranch("");
                    setSteps([1, 2, 3, 4]);
                }
            } catch (e) {
                setAvailableBranches([]);
                setSelectedBranch("");
                setSteps([1, 2, 3, 4]);
            }
        };
        fetchTemplate();
    }, [cursus, filiere, groupe, academicYear]);

    const handleCursusChange = (value: string) => {
        setCursus(value as Cursus);
        setFiliere(null);
        setGroupe(null);
        setAcademicYear(null);
        setSelectedBranch("");
        setAvailableFilieres([]);
        setAvailableGroupes([]);
        setAvailableYears([]);
        setAvailableBranches([]);
    };

    const handleFiliereChange = (value: string) => {
        setFiliere(value as Filiere);
        setGroupe(null);
        setAcademicYear(null);
        setSelectedBranch("");
        setAvailableGroupes([]);
        setAvailableYears([]);
        setAvailableBranches([]);
    };

    const handleGroupeChange = (value: string) => {
        setGroupe(value as Groupe);
        setAcademicYear(null);
        setSelectedBranch("");
        setAvailableYears([]);
        setAvailableBranches([]);
    };

    const handleYearChange = (value: string) => {
        setAcademicYear(value);
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
    };

    const handleSubmit = async () => {
        if (!cursus || !filiere || !groupe || !academicYear) return;
        if (availableBranches.length > 0 && !selectedBranch) return;
        setLoading(true);
        try {
            const response = await fetch("/api/grades/setup-profile", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({cursus, filiere, groupe, academicYear, branch: selectedBranch || undefined})
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/grades");
            } else if (response.status === 409) {
                router.push("/grades");
            } else {
                alert(`Erreur: ${data.error || "Erreur inconnue"}`);
            }
        } catch (error) {
            console.error("Error setting up profile:", error);
            alert("Erreur lors de la configuration du profil");
        } finally {
            setLoading(false);
        }
    };

    const isFormComplete = cursus && filiere && groupe && academicYear && (availableBranches.length === 0 || selectedBranch);
    const completedSteps = [cursus, filiere, groupe, academicYear, availableBranches.length > 0 && selectedBranch].filter(Boolean).length;

    // Loading screen
    if (checkingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary"/>
                    <p className="text-muted-foreground">Vérification de votre profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/50">
            <div className="px-4 py-8 md:py-12 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-8 md:mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
                        <GraduationCap className="h-10 w-10 md:h-12 md:w-12 text-primary"/>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            {userName ? `Bienvenue ${userName} !` : "Configuration"}
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
                            Configure ton parcours pour commencer à suivre tes notes 📊
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {steps.map((step) => (
                            <div
                                key={step}
                                className={`h-2 w-12 md:w-16 rounded-full transition-all duration-300 ${
                                    step <= completedSteps
                                        ? "bg-primary"
                                        : "bg-muted-foreground/20"
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {completedSteps}/{steps.length} étapes complétées
                    </p>
                </div>

                {/* Main Form Card */}
                <Card className="border-2 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="h-5 w-5 text-primary"/>
                            Ton parcours académique
                        </CardTitle>
                        <CardDescription>
                            Sélectionne les informations correspondant à ta situation actuelle
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Cursus Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <BookOpen className="h-4 w-4 text-muted-foreground"/>
                                Type de formation
                                {cursus && <CheckCircle2 className="h-4 w-4 text-green-500"/>}
                            </Label>
                            {availableCursus.length === 0 ? (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    <span className="text-sm text-muted-foreground">Chargement...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {availableCursus.map((c) => {
                                        const info = getCursusLabel(c);
                                        const isSelected = cursus === c;
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => handleCursusChange(c)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md cursor-pointer ${
                                                    isSelected
                                                        ? "border-primary bg-primary/5 shadow-md"
                                                        : "border-border hover:border-primary/50"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{info.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm">{c}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {info.label}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0"/>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Filiere Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <GraduationCap className="h-4 w-4 text-muted-foreground"/>
                                Niveau d&apos;études
                                {filiere && <CheckCircle2 className="h-4 w-4 text-green-500"/>}
                            </Label>
                            <Select
                                value={filiere || ""}
                                onValueChange={handleFiliereChange}
                                disabled={!cursus || loadingFilieres}
                            >
                                <SelectTrigger className={`h-12 ${!cursus ? "opacity-50" : ""} cursor-pointer`}>
                                    <SelectValue placeholder={
                                        !cursus
                                            ? "Sélectionne d'abord une formation"
                                            : loadingFilieres
                                                ? "Chargement..."
                                                : "Choisis ton niveau"
                                    }/>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFilieres.map((f) => {
                                        const info = getFiliereLabel(f);
                                        return (
                                            <SelectItem key={f} value={f} className="py-3 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="font-mono">
                                                        {f}
                                                    </Badge>
                                                    <span>{info.label}</span>
                                                    {info.year && (
                                                        <span className="text-muted-foreground text-xs">
                                                            ({info.year})
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Groupe Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                Spécialité
                                {groupe && <CheckCircle2 className="h-4 w-4 text-green-500"/>}
                            </Label>
                            <Select
                                value={groupe || ""}
                                onValueChange={handleGroupeChange}
                                disabled={!filiere || loadingGroupes}
                            >
                                <SelectTrigger className={`h-12 ${!filiere ? "opacity-50" : ""} cursor-pointer`}>
                                    <SelectValue placeholder={
                                        !filiere
                                            ? "Sélectionne d'abord un niveau"
                                            : loadingGroupes
                                                ? "Chargement..."
                                                : "Choisis ton groupe"
                                    }/>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableGroupes.map((g) => (
                                        <SelectItem key={g} value={g} className="py-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{g}</Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Academic Year Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                Année académique
                                {academicYear && <CheckCircle2 className="h-4 w-4 text-green-500"/>}
                            </Label>
                            <Select
                                value={academicYear || ""}
                                onValueChange={handleYearChange}
                                disabled={!groupe || loadingYears}
                            >
                                <SelectTrigger className={`h-12 ${!groupe ? "opacity-50" : ""} cursor-pointer`}>
                                    <SelectValue placeholder={
                                        !groupe
                                            ? "Sélectionne d'abord un groupe"
                                            : loadingYears
                                                ? "Chargement..."
                                                : "Choisis l'année"
                                    }/>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={year} className="py-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                                <span className="font-medium">{year}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch Selection (if any) */}
                        {availableBranches.length > 0 && (
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <Sparkles className="h-4 w-4 text-muted-foreground"/>
                                    Groupe
                                    {selectedBranch && <CheckCircle2 className="h-4 w-4 text-green-500"/>}
                                </Label>
                                <Select
                                    value={selectedBranch}
                                    onValueChange={handleBranchChange}
                                    disabled={availableBranches.length === 0}
                                >
                                    <SelectTrigger className={`h-12 ${availableBranches.length === 0 ? "opacity-50" : ""} cursor-pointer`}>
                                        <SelectValue placeholder="Choisis ta branche"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableBranches.map((branch) => (
                                            <SelectItem key={branch} value={branch} className="py-3 cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{branch}</Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Summary */}
                        {completedSteps > 0 && (
                            <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Récapitulatif de ta sélection
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {cursus && (
                                        <Badge variant="secondary" className="gap-1">
                                            <BookOpen className="h-3 w-3"/>
                                            {cursus}
                                        </Badge>
                                    )}
                                    {filiere && (
                                        <Badge variant="secondary" className="gap-1">
                                            <GraduationCap className="h-3 w-3"/>
                                            {filiere}
                                        </Badge>
                                    )}
                                    {groupe && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Users className="h-3 w-3"/>
                                            {groupe}
                                        </Badge>
                                    )}
                                    {academicYear && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Calendar className="h-3 w-3"/>
                                            {academicYear}
                                        </Badge>
                                    )}
                                    {selectedBranch && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Sparkles className="h-3 w-3"/>
                                            {selectedBranch}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            size="lg"
                            className="w-full h-14 text-base font-semibold gap-2 cursor-pointer"
                            disabled={!isFormComplete || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                    Configuration en cours...
                                </>
                            ) : isFormComplete ? (
                                <>
                                    C&apos;est parti ! 🚀
                                    <ArrowRight className="h-5 w-5"/>
                                </>
                            ) : (
                                <>
                                    Complete ta sélection
                                    <span className="text-sm opacity-70">({completedSteps}/4)</span>
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Help text */}
                <p className="text-center text-sm text-muted-foreground mt-6 px-4">
                    Tu pourras modifier ton parcours plus tard dans les notes
                </p>
            </div>
        </div>
    );
}