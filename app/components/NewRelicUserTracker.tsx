'use client'

import { useNewRelicUser } from '@lib/hooks/useNewRelic'

/**
 * Component that initializes New Relic browser monitoring with user context.
 * This component should be placed inside SessionProvider to access user session.
 * It renders nothing visually but sets up user tracking in New Relic.
 */
export function NewRelicUserTracker() {
    useNewRelicUser()
    return null
}
