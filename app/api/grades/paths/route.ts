import {NextResponse} from "next/server";
import clientPromise from "@lib/mongodb";
import {
    getAcademicProfile,
    addAcademicPath,
    setActivePath,
    removeAcademicPath
} from "@lib/grades/profileService";
import {AcademicPath, Cursus, Filiere, Groupe} from "@lib/grades/types";
import {requestAuthCheck} from "@lib/api/request_check";

/**
 * GET - Get user's academic profile with all paths
 */
export async function GET() {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({email: session.user.email});

        if (!user) {
            return NextResponse.json(
                {error: "Utilisateur non trouvé"},
                {status: 404}
            );
        }

        const profile = await getAcademicProfile(user._id.toString());

        if (!profile) {
            return NextResponse.json({
                success: true,
                profile: null
            });
        }

        return NextResponse.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error("Error getting academic profile:", error);
        return NextResponse.json(
            {error: "Erreur serveur"},
            {status: 500}
        );
    }
}

/**
 * POST - Add a new academic path
 */
export async function POST(request: Request) {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const {cursus, filiere, groupe, academicYear, setAsActive} = await request.json();

        if (!cursus || !filiere || !groupe) {
            return NextResponse.json(
                {error: "Cursus, filière et groupe requis"},
                {status: 400}
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({email: session.user.email});

        if (!user) {
            return NextResponse.json(
                {error: "Utilisateur non trouvé"},
                {status: 404}
            );
        }

        if (!session.user.email) {
            return NextResponse.json(
                {error: "Utilisateur non trouvé"},
                {status: 404}
            );
        }

        const profile = await addAcademicPath(
            user._id.toString(),
            cursus as Cursus,
            filiere as Filiere,
            groupe as Groupe,
            academicYear,
            setAsActive,
            session.user.email
        );

        return NextResponse.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error("Error adding academic path:", error);
        return NextResponse.json(
            {error: "Erreur serveur"},
            {status: 500}
        );
    }
}

/**
 * PUT - Set active path
 */
export async function PUT(request: Request) {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const {pathId} = await request.json();

        if (!pathId) {
            return NextResponse.json(
                {error: "Path ID requis"},
                {status: 400}
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({email: session.user.email});

        if (!user) {
            return NextResponse.json(
                {error: "Utilisateur non trouvé"},
                {status: 404}
            );
        }

        const profile = await setActivePath(user._id.toString(), pathId);

        return NextResponse.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error("Error setting active path:", error);
        return NextResponse.json(
            {error: "Erreur serveur"},
            {status: 500}
        );
    }
}

/**
 * DELETE - Remove an academic path
 */
export async function DELETE(request: Request) {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const {searchParams} = new URL(request.url);
        const pathId = searchParams.get('pathId');

        if (!pathId) {
            return NextResponse.json(
                {error: "Path ID requis"},
                {status: 400}
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({email: session.user.email});

        if (!user) {
            return NextResponse.json(
                {error: "Utilisateur non trouvé"},
                {status: 404}
            );
        }

        const academicProfile = await db.collection('academicProfiles').findOne({
            userId: user._id,
        });

        if (!academicProfile) {
            return NextResponse.json(
                {error: "Profil académique non trouvé"},
                {status: 404}
            );
        }

        const path = academicProfile.paths.find((p: AcademicPath) => p.id === pathId);
        if (!path) {
            return NextResponse.json(
                {error: "Parcours non trouvé"},
                {status: 404}
            );
        }

        const deleted = await removeAcademicPath(user._id.toString(), pathId);

        if (!deleted) {
            return NextResponse.json(
                {error: "Parcours non trouvé"},
                {status: 404}
            );
        }

        // If the path has been removed, now we need to remove associated semesters
        await db.collection('userSemesters').deleteMany({
            userId: user._id,
            cursus: path.cursus,
            filiere: path.filiere,
            groupe: path.groupe,
            academicYear: path.academicYear
        });

        return NextResponse.json({
            success: true,
            message: "Parcours supprimé"
        });
    } catch (error) {
        console.error("Error removing academic path:", error);
        return NextResponse.json(
            {error: "Erreur serveur"},
            {status: 500}
        );
    }
}
