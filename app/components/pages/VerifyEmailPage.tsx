"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, Loader2, ShieldCheck, Check, ArrowLeft, RefreshCw } from "lucide-react";

// Regex pour valider les emails EFREI (quelquechose.quelquechose@efrei.net)
const efreiEmailRegex = /^[^.\s@]+\.[^.\s@]+@efrei\.net$/i;

type Step = 'email' | 'code';

export default function VerifyEmailPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const statusCheckedRef = useRef(false);

    // Email step
    const [emailEfrei, setEmailEfrei] = useState("");
    const [emailError, setEmailError] = useState("");
    const [emailValid, setEmailValid] = useState(false);

    // Code step
    const [verificationCode, setVerificationCode] = useState("");
    const [codeError, setCodeError] = useState("");
    const [codeValid, setCodeValid] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Validation de l'email EFREI
    const validateEmail = (value: string): boolean => {
        const trimmed = value.trim().toLowerCase();

        if (!trimmed) {
            setEmailError("L'adresse email EFREI est requise");
            setEmailValid(false);
            return false;
        }

        if (!trimmed.endsWith("@efrei.net")) {
            setEmailError("L'email doit se terminer par @efrei.net");
            setEmailValid(false);
            return false;
        }

        if (!efreiEmailRegex.test(trimmed)) {
            setEmailError("L'email doit être au format prenom.nom@efrei.net");
            setEmailValid(false);
            return false;
        }

        setEmailError("");
        setEmailValid(true);
        return true;
    };

    // Validation du code
    const validateCode = (value: string): boolean => {
        const trimmed = value.trim().replace(/\s/g, '');

        if (!trimmed) {
            setCodeError("Le code de vérification est requis");
            setCodeValid(false);
            return false;
        }

        if (!/^\d{6}$/.test(trimmed)) {
            setCodeError("Le code doit contenir exactement 6 chiffres");
            setCodeValid(false);
            return false;
        }

        setCodeError("");
        setCodeValid(true);
        return true;
    };

    // Gérer la saisie de l'email
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setEmailEfrei(value);
        if (emailError) validateEmail(value);
    };

    // Gérer la saisie du code
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setVerificationCode(value);
        if (codeError) validateCode(value);
    };

    // Vérifier le statut de l'utilisateur au chargement
    useEffect(() => {
        if (statusCheckedRef.current) return;
        statusCheckedRef.current = true;

        const checkStatus = async () => {
            try {
                const response = await fetch("/api/user/profile");
                const data = await response.json();

                // Si l'utilisateur est déjà vérifié, rediriger
                if (data.emailVerified === true) {
                    router.push("/setup");
                    return;
                }

                // Si l'utilisateur a déjà un email EFREI en attente de vérification
                if (data.emailEfrei) {
                    setEmailEfrei(data.emailEfrei);
                    setStep('code');
                }
            } catch (error) {
                console.error("Error checking status:", error);
            } finally {
                setCheckingStatus(false);
            }
        };

        checkStatus();
    }, [router]);

    // Countdown pour le renvoi de code
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    // Envoyer le code de vérification
    const handleSendCode = async () => {
        if (!validateEmail(emailEfrei)) return;

        setLoading(true);
        setEmailError("");

        try {
            const response = await fetch("/api/user/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailEfrei: emailEfrei.trim().toLowerCase() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Check if rate limited - allow user to proceed without verification
                if (data.rateLimited) {
                    router.push("/setup");
                    return;
                }
                setStep('code');
                setResendCountdown(60);
            } else {
                setEmailError(data.error || "Erreur lors de l'envoi du code");
            }
        } catch (error) {
            console.error("Error sending code:", error);
            setEmailError("Erreur lors de l'envoi du code");
        } finally {
            setLoading(false);
        }
    };

    // Vérifier le code
    const handleVerifyCode = async () => {
        if (!validateCode(verificationCode)) return;

        setLoading(true);
        setCodeError("");

        try {
            const response = await fetch("/api/user/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: parseInt(verificationCode, 10) })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.push("/setup");
            } else {
                setCodeError(data.error || "Code incorrect");
            }
        } catch (error) {
            console.error("Error verifying code:", error);
            setCodeError("Erreur lors de la vérification");
        } finally {
            setLoading(false);
        }
    };

    // Renvoyer le code
    const handleResendCode = async () => {
        if (resendCountdown > 0) return;

        setLoading(true);
        setCodeError("");

        try {
            const response = await fetch("/api/user/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailEfrei: emailEfrei.trim().toLowerCase() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Check if rate limited - allow user to proceed without verification
                if (data.rateLimited) {
                    router.push("/setup");
                    return;
                }
                setResendCountdown(60);
                setVerificationCode("");
            } else {
                setCodeError(data.error || "Erreur lors de l'envoi du code");
            }
        } catch (error) {
            console.error("Error resending code:", error);
            setCodeError("Erreur lors de l'envoi du code");
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted py-6 sm:py-8 md:py-12">
            <div className="px-4 sm:px-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8 md:mb-12">
                    <div className="flex justify-center">
                        <div className="relative">
                            <Mail className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                        Vérifie ton email 📧
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                        Pour accéder à MyEFREI Grades, vérifie ton adresse email EFREI.
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div className={`flex items-center gap-1 sm:gap-2 ${step === 'email' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${step === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            1
                        </div>
                        <span className="text-xs sm:text-sm">Email</span>
                    </div>
                    <div className="w-8 sm:w-12 h-0.5 bg-muted" />
                    <div className={`flex items-center gap-1 sm:gap-2 ${step === 'code' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${step === 'code' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            2
                        </div>
                        <span className="text-xs sm:text-sm">Code</span>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="border-2 border-primary/20">
                    {step === 'email' ? (
                        <>
                            <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
                                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                    <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                                    <div>
                                        <CardTitle className="text-base sm:text-lg md:text-xl">Ton email EFREI</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            Entre ton adresse @efrei.net pour recevoir un code.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 px-4 sm:px-6">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="emailEfrei" className="text-sm">Adresse email EFREI</Label>
                                    <div className="relative">
                                        <Input
                                            id="emailEfrei"
                                            type="email"
                                            placeholder="prenom.nom@efrei.net"
                                            value={emailEfrei}
                                            onChange={handleEmailChange}
                                            onBlur={() => emailEfrei && validateEmail(emailEfrei)}
                                            className={`h-10 sm:h-11 text-sm sm:text-base pr-10 ${emailError ? "border-red-500" : emailValid ? "border-green-500" : ""}`}
                                        />
                                        {emailValid && (
                                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                        )}
                                    </div>
                                    {emailError ? (
                                        <p className="text-xs text-red-500">{emailError}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Format : prenom.nom@efrei.net
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full mt-3 sm:mt-4 md:mt-6 h-10 sm:h-12 text-sm sm:text-base cursor-pointer"
                                    disabled={!emailEfrei.trim() || loading}
                                    onClick={handleSendCode}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            Envoyer le code
                                            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
                                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                    <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                                    <div>
                                        <CardTitle className="text-base sm:text-lg md:text-xl">Code de vérification</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm break-all">
                                            Code envoyé à <strong>{emailEfrei}</strong>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 px-4 sm:px-6">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="verificationCode" className="text-sm">Code de vérification</Label>
                                    <div className="relative">
                                        <Input
                                            id="verificationCode"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="000000"
                                            value={verificationCode}
                                            onChange={handleCodeChange}
                                            onBlur={() => verificationCode && validateCode(verificationCode)}
                                            maxLength={6}
                                            className={`h-12 sm:h-14 text-center text-xl sm:text-2xl font-mono tracking-[0.3em] sm:tracking-[0.5em] ${codeError ? "border-red-500" : codeValid ? "border-green-500" : ""}`}
                                        />
                                        {codeValid && (
                                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                        )}
                                    </div>
                                    {codeError ? (
                                        <p className="text-xs text-red-500">{codeError}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Entre le code à 6 chiffres reçu par email
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 sm:gap-3">
                                    <Button
                                        size="lg"
                                        className="w-full h-10 sm:h-12 text-sm sm:text-base cursor-pointer"
                                        disabled={verificationCode.length !== 6 || loading}
                                        onClick={handleVerifyCode}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                Vérification...
                                            </>
                                        ) : (
                                            <>
                                                Vérifier
                                                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm cursor-pointer"
                                            onClick={() => {
                                                setStep('email');
                                                setVerificationCode("");
                                                setCodeError("");
                                            }}
                                        >
                                            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            Changer
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm cursor-pointer"
                                            disabled={resendCountdown > 0 || loading}
                                            onClick={handleResendCode}
                                        >
                                            <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                                            {resendCountdown > 0 ? `${resendCountdown}s` : 'Renvoyer'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>

                {/* Info box */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        💡 Le code expire dans <strong>15 min</strong>. Vérifie tes spams si besoin.
                    </p>
                </div>
            </div>
        </div>
    );
}
