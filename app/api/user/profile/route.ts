import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import {requestAuthCheck} from "@lib/api/request_check";

// Regex pour les noms (lettres, accents, tirets, apostrophes, espaces)
const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// Fonction pour valider un nom (prénom ou nom de famille)
function validateName(name: string, fieldName: string): { valid: boolean; error?: string } {
    const trimmed = name?.trim() || '';

    if (!trimmed) {
        return { valid: false, error: `Le ${fieldName} est requis` };
    }
    if (trimmed.length < 2) {
        return { valid: false, error: `Le ${fieldName} doit contenir au moins 2 caractères` };
    }
    if (trimmed.length > 50) {
        return { valid: false, error: `Le ${fieldName} ne peut pas dépasser 50 caractères` };
    }
    if (!nameRegex.test(trimmed)) {
        return { valid: false, error: `Le ${fieldName} ne peut contenir que des lettres, tirets et apostrophes` };
    }

    return { valid: true };
}

// Fonction pour formater le prénom (première lettre en majuscule)
function formatFirstName(value: string): string {
    return value.trim()
        .split(/[\s-]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(value.includes('-') ? '-' : ' ');
}

// Fonction pour formater le nom de famille (tout en majuscule)
function formatLastName(value: string): string {
    return value.trim().toUpperCase();
}

// Fonction pour valider le numéro étudiant (exactement 8 chiffres, commence par une année valide)
function validateStudentNumber(studentNumber: string): { valid: boolean; error?: string } {
    const trimmed = studentNumber?.trim() || '';

    if (!trimmed) {
        return { valid: false, error: "Le numéro étudiant est requis" };
    }

    // Vérifier que c'est uniquement des chiffres
    if (!/^\d+$/.test(trimmed)) {
        return { valid: false, error: "Le numéro étudiant ne doit contenir que des chiffres" };
    }

    // Vérifier la longueur exacte de 8 chiffres
    if (trimmed.length !== 8) {
        return { valid: false, error: "Le numéro étudiant doit contenir exactement 8 chiffres" };
    }

    // Extraire les 4 premiers caractères comme année
    const yearStr = trimmed.substring(0, 4);
    const year = parseInt(yearStr, 10);


    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 1) {
        return { valid: false, error: `L'année doit être comprise entre 2000 et ${currentYear + 1}` };
    }

    return { valid: true };
}

// GET - Récupérer le profil de l'utilisateur
export async function GET() {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection('users').findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        return NextResponse.json({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            studentNumber: user.studentNumber || '',
            email: user.email || '',
            nameInStats: user.nameInStats || false,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// PUT - Mettre à jour le profil de l'utilisateur
export async function PUT(request: NextRequest) {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const body = await request.json();
        const { firstName, lastName, studentNumber, nameInStats } = body;

        // Validation du prénom
        const firstNameValidation = validateName(firstName, "prénom");
        if (!firstNameValidation.valid) {
            return NextResponse.json({ error: firstNameValidation.error }, { status: 400 });
        }

        // Validation du nom
        const lastNameValidation = validateName(lastName, "nom");
        if (!lastNameValidation.valid) {
            return NextResponse.json({ error: lastNameValidation.error }, { status: 400 });
        }

        // Validation du numéro étudiant
        const studentNumberValidation = validateStudentNumber(studentNumber);
        if (!studentNumberValidation.valid) {
            return NextResponse.json({ error: studentNumberValidation.error }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Vérifier si le numéro étudiant est déjà utilisé par un autre utilisateur
        const existingWithNumber = await db.collection('users').findOne({
            studentNumber: studentNumber.trim(),
            email: { $ne: session.user.email }
        });

        if (existingWithNumber) {
            return NextResponse.json({ error: "Ce numéro étudiant est déjà utilisé" }, { status: 400 });
        }

        // Formater et sauvegarder les données
        const formattedFirstName = formatFirstName(firstName);
        const formattedLastName = formatLastName(lastName);
        const trimmedStudentNumber = studentNumber.trim();

        // Vérifier si l'utilisateur a déjà un createdAt
        const existingUser = await db.collection('users').findOne({ email: session.user.email });
        const updateData: Record<string, unknown> = {
            firstName: formattedFirstName,
            lastName: formattedLastName,
            studentNumber: trimmedStudentNumber,
            nameInStats: Boolean(nameInStats),
        };

        // Ajouter createdAt si il n'existe pas
        if (existingUser && !existingUser.createdAt) {
            updateData.createdAt = new Date();
        }

        // Mettre à jour le profil
        await db.collection('users').updateOne(
            { email: session.user.email },
            { $set: updateData }
        );

        return NextResponse.json({
            success: true,
            firstName: formattedFirstName,
            lastName: formattedLastName,
            studentNumber: trimmedStudentNumber,
            nameInStats: Boolean(nameInStats),
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
