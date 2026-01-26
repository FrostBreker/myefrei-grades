"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    GraduationCap,
    Mail,
    Hash,
    BookOpen,
    Calendar,
    Settings,
    ArrowRight
} from "lucide-react";
import { AcademicPath } from "@lib/grades/types";

interface UserProfile {
    firstName: string;
    lastName: string;
    studentNumber: string;
    email: string;
    image: string;
    createdAt: string;
}

interface AcademicProfile {
    paths: AcademicPath[];
}

interface ProfilePageProps {
    initialProfile: UserProfile;
    initialAcademicProfile: AcademicProfile | null;
}

export default function ProfilePage({ initialProfile, initialAcademicProfile }: ProfilePageProps) {
    const router = useRouter();
    const [profile] = useState<UserProfile>(initialProfile);
    const [academicProfile] = useState<AcademicProfile | null>(initialAcademicProfile);

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        if (profile.firstName && profile.lastName) {
            return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
        }
        return profile.email.charAt(0).toUpperCase();
    };

    // Get current academic path (most recent)
    const getCurrentPath = (): AcademicPath | null => {
        if (!academicProfile || academicProfile.paths.length === 0) return null;
        // Sort by academic year descending to get the most recent
        const sortedPaths = [...academicProfile.paths].sort((a, b) =>
            b.academicYear.localeCompare(a.academicYear)
        );
        return sortedPaths[0];
    };

    const currentPath = getCurrentPath();

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted py-8 md:py-12">
            <div className="px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                        Mon Profil
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Tes informations personnelles et académiques
                    </p>
                </div>

                {/* Profile Card */}
                <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                <AvatarImage src={profile.image} alt={`${profile.firstName} ${profile.lastName}`} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl sm:text-3xl">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center sm:text-left space-y-1">
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {profile.firstName} {profile.lastName}
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Étudiant EFREI
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Personal Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium truncate">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Hash className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Numéro étudiant</p>
                                    <p className="font-medium font-mono">{profile.studentNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Membre depuis</p>
                                    <p className="font-medium">{formatDate(profile.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Année d&apos;entrée</p>
                                    <p className="font-medium">{profile.studentNumber.substring(0, 4)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Academic Profile Card */}
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Parcours Académique</CardTitle>
                                <CardDescription>Ton programme actuel</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {currentPath ? (
                            <div className="space-y-4">
                                {/* Current Program */}
                                <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="default">Programme actuel</Badge>
                                        <Badge variant="secondary">{currentPath.academicYear}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Cursus</p>
                                            <p className="font-semibold text-lg">{currentPath.cursus}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Niveau</p>
                                            <p className="font-semibold text-lg">{currentPath.filiere}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Groupe/Parcours</p>
                                            <p className="font-semibold text-lg">{currentPath.groupe}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Previous Programs (if any) */}
                                {academicProfile && academicProfile.paths.length > 1 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            Parcours précédents
                                        </h4>
                                        <div className="space-y-2">
                                            {academicProfile.paths
                                                .filter(p => p.academicYear !== currentPath.academicYear)
                                                .sort((a, b) => b.academicYear.localeCompare(a.academicYear))
                                                .map((path, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50"
                                                    >
                                                        <Badge variant="outline">{path.academicYear}</Badge>
                                                        <span className="text-sm">
                                                            {path.cursus} • {path.filiere} • {path.groupe}
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Aucun parcours configuré</p>
                                    <p className="text-sm text-muted-foreground">
                                        Configure ton parcours académique pour commencer
                                    </p>
                                </div>
                                <Button onClick={() => router.push('/setup')}>
                                    Configurer mon parcours
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="outline"
                        disabled
                        onClick={() => router.push('/onboarding')}
                        className="gap-2 cursor-pointer"
                    >
                        <Settings className="h-4 w-4" />
                        Modifier mes informations
                    </Button>
                    <Button
                        onClick={() => router.push('/grades')}
                        className="gap-2  cursor-pointer"
                    >
                        <GraduationCap className="h-4 w-4" />
                        Voir mes notes
                    </Button>
                </div>
            </div>
        </div>
    );
}
