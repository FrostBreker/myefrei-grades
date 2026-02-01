// Global state for email service status
// This tracks if Resend rate limit has been hit

interface EmailServiceState {
    isRateLimited: boolean;
    rateLimitedAt: Date | null;
    rateLimitResetAt: Date | null;
}

// In-memory state (resets on server restart)
let emailServiceState: EmailServiceState = {
    isRateLimited: false,
    rateLimitedAt: null,
    rateLimitResetAt: null,
};

/**
 * Mark the email service as rate limited
 * The limit will auto-reset after the specified hours (default 24h for daily limit)
 */
export function setEmailServiceRateLimited(resetAfterHours: number = 24): void {
    const now = new Date();
    emailServiceState = {
        isRateLimited: true,
        rateLimitedAt: now,
        rateLimitResetAt: new Date(now.getTime() + resetAfterHours * 60 * 60 * 1000),
    };
    console.warn(`[Email Service] Rate limit hit. Will reset at ${emailServiceState.rateLimitResetAt?.toISOString()}`);
}

/**
 * Check if the email service is currently rate limited
 * Auto-resets if the reset time has passed
 */
export function isEmailServiceRateLimited(): boolean {
    if (!emailServiceState.isRateLimited) {
        return false;
    }

    // Check if reset time has passed
    if (emailServiceState.rateLimitResetAt && new Date() > emailServiceState.rateLimitResetAt) {
        // Reset the state
        emailServiceState = {
            isRateLimited: false,
            rateLimitedAt: null,
            rateLimitResetAt: null,
        };
        console.info('[Email Service] Rate limit reset.');
        return false;
    }

    return true;
}

/**
 * Manually reset the rate limit (for admin use)
 */
export function resetEmailServiceRateLimit(): void {
    emailServiceState = {
        isRateLimited: false,
        rateLimitedAt: null,
        rateLimitResetAt: null,
    };
    console.info('[Email Service] Rate limit manually reset.');
}

/**
 * Get current email service status
 */
export function getEmailServiceStatus(): EmailServiceState {
    // Check for auto-reset before returning
    isEmailServiceRateLimited();
    return { ...emailServiceState };
}
