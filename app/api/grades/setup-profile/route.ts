import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]/route";
import { createAcademicProfile, getAcademicProfile } from "@lib/grades/profileService";
import { Cursus, Filiere, Groupe } from "@lib/grades/types";
import clientPromise from "@lib/mongodb";

export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        const { cursus, filiere, groupe } = await request.json();

        // Validate inputs
        if (!cursus || !filiere || !groupe) {
            return NextResponse.json(
                { error: "Paramètres manquants" },
                { status: 400 }
            );
        }

        // Get user ID
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        // Check if profile already exists
        const existingProfile = await getAcademicProfile(user._id.toString());
        if (existingProfile) {
            return NextResponse.json(
                { error: "Profil académique déjà existant" },
                { status: 409 }
            );
        }

        // Create new academic profile with first path
        const profile = await createAcademicProfile(
            user._id.toString(),
            session.user.email,
            cursus as Cursus,
            filiere as Filiere,
            groupe as Groupe
        );

        return NextResponse.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error("Error setting up profile:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        // Get user ID
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        // Get academic profile using new service
        const profile = await getAcademicProfile(user._id.toString());

        if (!profile) {
            return NextResponse.json(
                { exists: false },
                { status: 200 }
            );
        }

        return NextResponse.json({
            exists: true,
            profile
        });
    } catch (error) {
        console.error("Error getting profile:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
