'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { setUserId, setCustomAttribute, addPageAction } from '@lib/newrelic-browser'

/**
 * Hook to initialize New Relic browser monitoring with user context
 * Place this in a component that wraps your authenticated pages
 */
export function useNewRelicUser() {
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Set user ID for session tracking
            if (session.user.email) {
                setUserId(session.user.email)
                setCustomAttribute('userEmail', session.user.email)
            }

            if (session.user.name) {
                setCustomAttribute('userName', session.user.name)
            }

            // Track successful authentication
            addPageAction('UserAuthenticated', {
                hasEmail: Boolean(session.user.email),
                hasName: Boolean(session.user.name),
            })
        }
    }, [session, status])

    return { session, status }
}

/**
 * Hook to track page views with user context
 */
export function usePageTracking(pageName: string) {
    const { status } = useSession()

    useEffect(() => {
        addPageAction('PageView', {
            pageName,
            isAuthenticated: status === 'authenticated',
            timestamp: Date.now()
        })
    }, [pageName, status])
}
