export async function register() {
    // Only run on Node.js runtime (not Edge)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const shouldEnableNewRelic =
            process.env.NODE_ENV === 'production' ||
            process.env.ENABLE_NEW_RELIC === 'true'

        if (shouldEnableNewRelic) {
            // Check if license key is configured
            if (!process.env.NEW_RELIC_LICENSE_KEY) {
                console.warn(
                    '⚠️  New Relic is enabled but NEW_RELIC_LICENSE_KEY is not set. Skipping initialization.'
                )
                return
            }

            console.log('🚀 Initializing New Relic...')

            // Dynamic import with platform-specific path handling
            await import('newrelic')

            console.log('✅ New Relic initialized successfully')
        } else {
            console.log('ℹ️  New Relic is disabled in development. Set ENABLE_NEW_RELIC=true to enable.')
        }
    }
}