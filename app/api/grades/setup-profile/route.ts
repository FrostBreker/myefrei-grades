import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@api/auth/[...nextauth]/route";
import {addAcademicPath, createAcademicProfile, getAcademicProfile} from "@lib/grades/profileService";
import {Branch, Cursus, Filiere, Groupe} from "@lib/grades/types";
import clientPromise from "@lib/mongodb";
import { instrumentApiRoute, noticeError, recordCustomEvent } from "@lib/newrelic";

export async function POST(request: Request) {
    return instrumentApiRoute('grades/setup-profile/POST', async () => {
        try {
            // Check authentication
            const session = await getServerSession(authOptions);
            if (!session || !session.user?.email) {
                return NextResponse.json(
                    {error: "Non autorisé"},
                    {status: 401}
                );
            }

            const {cursus, filiere, groupe, branch, academicYear} = await request.json();

            // Validate inputs
            if (!cursus || !filiere || !groupe) {
                return NextResponse.json(
                    {error: "Paramètres manquants"},
                    {status: 400}
                );
            }

            // Get user ID
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({email: session.user.email});

            if (!user) {
                return NextResponse.json(
                    {error: "Utilisateur non trouvé"},
                    {status: 404}
                );
            }

            // Check if profile already exists
            const existingProfile = await getAcademicProfile(user._id.toString());
            if (existingProfile && existingProfile.paths.length > 0) {
                console.log("Profile already exists for user:", user.email, "Profile ID:", existingProfile._id);
                return NextResponse.json(
                    {
                        error: "Profil académique déjà existant",
                        exists: true,
                        profileId: existingProfile._id
                    },
                    {status: 409}
                );
            } else if (existingProfile && existingProfile.paths.length === 0) {
                console.log("Profile exists without paths for user:", user.email, "Adding first path.");
                // Handle case where profile exists but has no paths
                const profile = await addAcademicPath(
                    user._id.toString(),
                    cursus as Cursus,
                    filiere as Filiere,
                    groupe as Groupe,
                    branch as Branch,
                    academicYear as string,
                    true,
                    user.email
                );

                return NextResponse.json({
                    success: true,
                    profile
                });

            }

            console.log("Creating new academic profile for user:", user.email);

            // Create new academic profile with first path
            const profile = await createAcademicProfile(
                user._id.toString(),
                session.user.email,
                cursus as Cursus,
                filiere as Filiere,
                groupe as Groupe,
                branch as Branch,
                academicYear as string
            );

            // Record custom event for new profile creation
            recordCustomEvent('ProfileCreated', {
                cursus,
                filiere,
                groupe,
                academicYear: academicYear || 'N/A'
            });

            return NextResponse.json({
                success: true,
                profile
            });
        } catch (error) {
            console.error("Error setting up profile:", error);
            if (error instanceof Error) noticeError(error, { route: 'grades/setup-profile/POST' });
            return NextResponse.json(
                {error: "Erreur serveur"},
                {status: 500}
            );
        }
    });
}

export async function GET() {
    return instrumentApiRoute('grades/setup-profile/GET', async () => {
        try {
            // Check authentication
            const session = await getServerSession(authOptions);
            if (!session || !session.user?.email) {
                return NextResponse.json(
                    {error: "Non autorisé"},
                    {status: 401}
                );
            }

            // Get user ID
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({email: session.user.email});

            if (!user) {
                return NextResponse.json(
                    {error: "Utilisateur non trouvé"},
                    {status: 404}
                );
            }

            // Get academic profile using new service
            const profile = await getAcademicProfile(user._id.toString());

            console.log("GET setup-profile - User:", user.email, "Has profile:", !!profile);

            if (!profile || profile?.paths.length === 0) {
                return NextResponse.json(
                    {exists: false},
                    {status: 200}
                );
            }

            return NextResponse.json({
                exists: true,
                profile
            });
        } catch (error) {
            console.error("Error getting profile:", error);
            if (error instanceof Error) noticeError(error, { route: 'grades/setup-profile/GET' });
            return NextResponse.json(
                {error: "Erreur serveur"},
                {status: 500}
            );
        }
    });
}