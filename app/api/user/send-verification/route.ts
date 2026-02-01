import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import { requestAuthCheck } from "@lib/api/request_check";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";
import { sendVerificationEmail, generateVerificationCode, EmailRateLimitError } from "@lib/email/resend";
import { isEmailServiceRateLimited } from "@lib/email/emailServiceState";

// Regex pour valider les emails EFREI (quelquechose.quelquechose@efrei.net)
const efreiEmailRegex = /^[^.\s@]+\.[^.\s@]+@efrei\.net$/i;

// POST - Send verification code to user's EFREI email
export async function POST(request: NextRequest) {
    return instrumentApiRoute('user/send-verification/POST', async () => {
        try {
            const session = await requestAuthCheck();
            if (!session || !session?.user) {
                return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
            }

            const body = await request.json();
            const { emailEfrei } = body;

            // Validate EFREI email format
            if (!emailEfrei || typeof emailEfrei !== 'string') {
                return NextResponse.json({ error: "L'adresse email EFREI est requise" }, { status: 400 });
            }

            const trimmedEmail = emailEfrei.trim().toLowerCase();

            if (!efreiEmailRegex.test(trimmedEmail)) {
                return NextResponse.json({
                    error: "L'adresse email doit être au format prenom.nom@efrei.net"
                }, { status: 400 });
            }

            const client = await clientPromise;
            const db = client.db();

            // Check if email service is rate limited
            if (isEmailServiceRateLimited()) {
                return NextResponse.json({
                    success: true,
                    rateLimited: true,
                    message: "Service d'email temporairement indisponible. Tu peux continuer sans vérification pour le moment."
                });
            }

            // Check if user exists
            const user = await db.collection('users').findOne({ email: session.user.email });
            if (!user) {
                return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
            }

            // Check if user is already verified
            if (user.emailVerified === true) {
                return NextResponse.json({ error: "Ton email est déjà vérifié" }, { status: 400 });
            }

            // Check if this EFREI email is already used by another user
            const existingUserWithEmail = await db.collection('users').findOne({
                emailEfrei: trimmedEmail,
                _id: { $ne: user._id }
            });

            if (existingUserWithEmail) {
                return NextResponse.json({
                    error: "Cette adresse email EFREI est déjà utilisée par un autre compte"
                }, { status: 400 });
            }

            // Rate limiting: check if last verification was sent less than 60 seconds ago
            if (user.lastVerificationSent) {
                const lastSent = new Date(user.lastVerificationSent);
                const now = new Date();
                const diffSeconds = (now.getTime() - lastSent.getTime()) / 1000;

                if (diffSeconds < 60) {
                    const waitTime = Math.ceil(60 - diffSeconds);
                    return NextResponse.json({
                        error: `Attends ${waitTime} secondes avant de renvoyer un code`
                    }, { status: 429 });
                }
            }

            // Generate verification code
            const verificationCode = generateVerificationCode();
            const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Update user with code and email
            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        emailEfrei: trimmedEmail,
                        verificationCode: verificationCode,
                        verificationCodeExpiry: codeExpiry,
                        lastVerificationSent: new Date()
                    },
                    $unset: {
                        verificationAttempts: ""
                    }
                }
            );

            // Send verification email
            try {
                await sendVerificationEmail({
                    to: trimmedEmail,
                    code: verificationCode,
                    firstName: user.firstName
                });
            } catch (emailError) {
                console.error("Error sending email:", emailError);

                // Check if it's a rate limit error
                if (emailError instanceof EmailRateLimitError) {
                    // Don't reset the code - the user can try again later
                    // But allow them to proceed without verification
                    return NextResponse.json({
                        success: true,
                        rateLimited: true,
                        message: "Limite d'envoi d'emails atteinte. Tu peux continuer sans vérification pour le moment."
                    });
                }

                // Reset the code if email fails for other reasons
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
                    error: "Erreur lors de l'envoi de l'email. Réessaie plus tard."
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "Code de vérification envoyé"
            });

        } catch (error) {
            console.error("Error in send-verification:", error);
            if (error instanceof Error) noticeError(error, { route: 'user/send-verification/POST' });
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }
    });
}
