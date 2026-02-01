'use client'

/**
 * New Relic Browser Agent utilities for client-side instrumentation.
 * These functions interact with the New Relic Browser agent injected via layout.tsx
 */

// Type for New Relic Browser Agent
interface NewRelicBrowser {
    setCustomAttribute: (name: string, value: string | number | boolean) => void
    addPageAction: (name: string, attributes?: Record<string, string | number | boolean>) => void
    noticeError: (error: Error, customAttributes?: Record<string, string | number | boolean>) => void
    setUserId: (userId: string) => void
    interaction: () => {
        setName: (name: string) => void
        save: () => void
        end: () => void
        setAttribute: (name: string, value: string | number | boolean) => void
    }
    finished: (time?: number) => void
}

declare global {
    interface Window {
        newrelic?: NewRelicBrowser
    }
}

/**
 * Check if New Relic Browser agent is available
 */
function isNewRelicAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.newrelic
}

/**
 * Set a custom attribute for the current page view
 */
export function setCustomAttribute(name: string, value: string | number | boolean): void {
    if (isNewRelicAvailable()) {
        window.newrelic!.setCustomAttribute(name, value)
    }
}

/**
 * Record a page action (custom event) for analytics
 */
export function addPageAction(
    name: string,
    attributes?: Record<string, string | number | boolean>
): void {
    if (isNewRelicAvailable()) {
        window.newrelic!.addPageAction(name, attributes)
    }
}

/**
 * Report a JavaScript error to New Relic
 */
export function noticeError(
    error: Error,
    customAttributes?: Record<string, string | number | boolean>
): void {
    if (isNewRelicAvailable()) {
        window.newrelic!.noticeError(error, customAttributes)
    }
}

/**
 * Set the user ID for the current session
 */
export function setUserId(userId: string): void {
    if (isNewRelicAvailable()) {
        window.newrelic!.setUserId(userId)
    }
}

/**
 * Start a browser interaction for tracking user actions
 */
export function startInteraction(name: string): (() => void) | null {
    if (isNewRelicAvailable()) {
        const interaction = window.newrelic!.interaction()
        interaction.setName(name)
        interaction.save()
        return () => interaction.end()
    }
    return null
}

/**
 * Track a user action with timing
 */
export function trackAction<T>(
    actionName: string,
    action: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    const startTime = performance.now()
    const endInteraction = startInteraction(actionName)

    return action()
        .then((result) => {
            const duration = performance.now() - startTime
            addPageAction(actionName, {
                ...attributes,
                duration,
                success: true
            })
            endInteraction?.()
            return result
        })
        .catch((error) => {
            const duration = performance.now() - startTime
            addPageAction(actionName, {
                ...attributes,
                duration,
                success: false,
                errorMessage: error?.message || 'Unknown error'
            })
            noticeError(error, {
                action: actionName,
                ...attributes
            })
            endInteraction?.()
            throw error
        })
}

/**
 * Track page navigation
 */
export function trackPageView(pageName: string, attributes?: Record<string, string | number | boolean>): void {
    addPageAction('PageView', {
        pageName,
        ...attributes
    })
}

/**
 * Track form submissions
 */
export function trackFormSubmit(
    formName: string,
    success: boolean,
    attributes?: Record<string, string | number | boolean>
): void {
    addPageAction('FormSubmit', {
        formName,
        success,
        ...attributes
    })
}

/**
 * Track API calls from client
 */
export function trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    success: boolean
): void {
    addPageAction('ApiCall', {
        endpoint,
        method,
        duration,
        statusCode,
        success
    })
}

/**
 * Track user engagement events
 */
export function trackEngagement(
    eventType: string,
    elementId?: string,
    attributes?: Record<string, string | number | boolean>
): void {
    addPageAction('UserEngagement', {
        eventType,
        elementId: elementId || 'unknown',
        ...attributes
    })
}
