import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import { requestAuthCheck } from "@lib/api/request_check";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";

// POST - Verify the code submitted by the user
export async function POST(request: NextRequest) {
    return instrumentApiRoute('user/verify-code/POST', async () => {
        try {
            const session = await requestAuthCheck();
            if (!session || !session?.user) {
                return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
            }

            const body = await request.json();
            const { code } = body;

            // Validate code format
            if (code === undefined || code === null) {
                return NextResponse.json({ error: "Le code de vérification est requis" }, { status: 400 });
            }

            const codeNumber = Number(code);

            if (isNaN(codeNumber) || codeNumber < 100000 || codeNumber > 999999) {
                return NextResponse.json({ error: "Le code doit être un nombre à 6 chiffres" }, { status: 400 });
            }

            const client = await clientPromise;
            const db = client.db();

            // Get user
            const user = await db.collection('users').findOne({ email: session.user.email });
            if (!user) {
                return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
            }

            // Check if already verified
            if (user.emailVerified === true) {
                return NextResponse.json({ error: "Ton email est déjà vérifié" }, { status: 400 });
            }

            // Check if verification code exists
            if (!user.verificationCode) {
                return NextResponse.json({
                    error: "Aucun code de vérification en attente. Demande un nouveau code."
                }, { status: 400 });
            }

            // Check if too many failed attempts (max 5)
            if (user.verificationAttempts && user.verificationAttempts >= 5) {
                // Clear the code after too many attempts
                await db.collection('users').updateOne(
                    { _id: user._id },
                    {
                        $unset: {
                            verificationCode: "",
                            verificationCodeExpiry: "",
                            verificationAttempts: ""
                        }
                    }
                );
                return NextResponse.json({
                    error: "Trop de tentatives échouées. Demande un nouveau code."
                }, { status: 429 });
            }

            // Check if code has expired
            if (user.verificationCodeExpiry && new Date(user.verificationCodeExpiry) < new Date()) {
                // Clear expired code
                await db.collection('users').updateOne(
                    { _id: user._id },
                    {
                        $unset: {
                            verificationCode: "",
                            verificationCodeExpiry: ""
                        }
                    }
                );
                return NextResponse.json({
                    error: "Le code a expiré. Demande un nouveau code."
                }, { status: 400 });
            }

            // Verify the code
            if (user.verificationCode !== codeNumber) {
                // Increment failed attempts counter
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $inc: { verificationAttempts: 1 } }
                );
                const attemptsLeft = 5 - ((user.verificationAttempts || 0) + 1);
                return NextResponse.json({
                    error: attemptsLeft > 0
                        ? `Code incorrect. ${attemptsLeft} tentative${attemptsLeft > 1 ? 's' : ''} restante${attemptsLeft > 1 ? 's' : ''}.`
                        : "Code incorrect."
                }, { status: 400 });
            }

            // Code is correct - update user
            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        emailVerified: true
                    },
                    $unset: {
                        verificationCode: "",
                        verificationCodeExpiry: "",
                        lastVerificationSent: "",
                        verificationAttempts: ""
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: "Email vérifié avec succès !"
            });

        } catch (error) {
            console.error("Error in verify-code:", error);
            if (error instanceof Error) noticeError(error, { route: 'user/verify-code/POST' });
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }
    });
}
