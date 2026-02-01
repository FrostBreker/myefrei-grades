import { Resend } from 'resend';
import { setEmailServiceRateLimited } from './emailServiceState';

const resend = new Resend(process.env.RESEND_API_KEY);

// Custom error class for rate limit
export class EmailRateLimitError extends Error {
    constructor(message: string = 'Email service rate limit reached') {
        super(message);
        this.name = 'EmailRateLimitError';
    }
}

interface SendVerificationEmailParams {
    to: string;
    code: number;
    firstName?: string;
}

export async function sendVerificationEmail({ to, code, firstName }: SendVerificationEmailParams) {
    const formattedCode = code.toString().split('').join(' ');
    const name = firstName || 'Étudiant';

    const { data, error } = await resend.emails.send({
        from: 'MyEFREI Grades <hello@genivo.fr>',
        to: to,
        subject: 'Bienvenue sur MyEFREI Grades',
        replyTo: 'donatien.faraut@efrei.net',
        html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 500px; margin: 0 auto; padding: 16px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 24px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Logo/Header -->
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; color: #2563eb; font-weight: 600;">
                    📚 MyEFREI Grades
                </h1>
            </div>
            
            <!-- Message principal -->
            <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #333; line-height: 1.5;">
                    Bonjour ${name},
                </p>
                <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.5;">
                    Pour finaliser ton inscription, entre ce code :
                </p>
            </div>
            
            <!-- Code Box -->
            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px 12px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2563eb; font-family: 'Courier New', Courier, monospace;">
                    ${formattedCode}
                </div>
            </div>
            
            <!-- Info -->
            <div style="background-color: #fef9e7; border-left: 4px solid #f59e0b; padding: 10px 12px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.4;">
                    ⏱️ Ce code expire dans 15 minutes.<br>
                    🔒 Ne le partage avec personne.
                </p>
            </div>
            
            <!-- Footer message -->
            <div>
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
                    À très bientôt ! 👋
                </p>
            </div>
            
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 16px; padding: 0 12px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #999; line-height: 1.4;">
                Tu n'as pas demandé ce code ? Ignore cet email.
            </p>
            <p style="margin: 0; font-size: 11px; color: #aaa;">
                © ${new Date().getFullYear()} MyEFREI Grades
            </p>
        </div>
    </div>
</body>
</html>
        `,
        text: `Bonjour ${name},

Merci de t'être inscrit sur MyEFREI Grades.

Pour finaliser ton inscription, entre ce code : ${code}

Ce code expire dans 15 minutes. Ne le partage avec personne.

À très bientôt sur MyEFREI Grades !

---

Tu n'as pas demandé ce code ? Ignore cet email.
Cet email a été envoyé à ${to} depuis grades.genivo.fr

© ${new Date().getFullYear()} MyEFREI Grades
        `
    });

    if (error) {
        console.error('Error sending verification email:', error);

        const errorMessage = error.message?.toLowerCase() || '';
        const isRateLimit =
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('daily sending limit') ||
            errorMessage.includes('quota exceeded') ||
            (error as { statusCode?: number }).statusCode === 429;

        if (isRateLimit) {
            setEmailServiceRateLimited(24);
            throw new EmailRateLimitError('Limite d\'envoi d\'emails atteinte. Réessaie demain.');
        }

        throw new Error('Failed to send verification email');
    }

    return data;
}

export function generateVerificationCode(): number {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000);
}
