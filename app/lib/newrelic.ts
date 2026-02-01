import newrelic from 'newrelic'

const isNewRelicEnabled =
    process.env.NODE_ENV === 'production' ||
    process.env.ENABLE_NEW_RELIC === 'true'

const isConfigured = Boolean(process.env.NEW_RELIC_LICENSE_KEY)

// Only use New Relic if it's both enabled and configured
const shouldUseNewRelic = isNewRelicEnabled && isConfigured

export function addCustomAttribute(key: string, value: string | number | boolean) {
    if (shouldUseNewRelic) {
        newrelic.addCustomAttribute(key, value)
    }
}

export function addCustomAttributes(attributes: Record<string, string | number | boolean>) {
    if (shouldUseNewRelic) {
        newrelic.addCustomAttributes(attributes)
    }
}

export function setTransactionName(name: string) {
    if (shouldUseNewRelic) {
        newrelic.setTransactionName(name)
    }
}

export function noticeError(
    error: Error,
    customAttributes?: Record<string, string | number | boolean>
) {
    if (shouldUseNewRelic) {
        newrelic.noticeError(error, customAttributes)
    }
}

/**
 * Start a web transaction for API routes
 */
export function startWebTransaction<T>(
    name: string,
    handler: () => Promise<T>
): Promise<T> {
    if (shouldUseNewRelic) {
        return newrelic.startWebTransaction(name, handler)
    }
    return handler()
}

/**
 * Start a background transaction for non-web operations
 */
export function startBackgroundTransaction<T>(
    name: string,
    group: string,
    handler: () => Promise<T>
): Promise<T> {
    if (shouldUseNewRelic) {
        return newrelic.startBackgroundTransaction(name, group, handler)
    }
    return handler()
}

/**
 * End the current transaction
 */
export function endTransaction() {
    if (shouldUseNewRelic) {
        newrelic.endTransaction()
    }
}

/**
 * Add user information to the transaction for better debugging
 */
export function setUserAttributes(userId?: string, email?: string) {
    if (shouldUseNewRelic && (userId || email)) {
        const attributes: Record<string, string> = {}
        if (userId) attributes.userId = userId
        if (email) attributes.userEmail = email
        newrelic.addCustomAttributes(attributes)
    }
}

/**
 * Record a custom event for analytics
 */
export function recordCustomEvent(eventType: string, attributes: Record<string, string | number | boolean>) {
    if (shouldUseNewRelic) {
        newrelic.recordCustomEvent(eventType, attributes)
    }
}

/**
 * Instrument an API route handler with automatic error tracking and transaction naming
 */
export async function instrumentApiRoute<T>(
    routeName: string,
    handler: () => Promise<T>,
    options?: {
        userId?: string
        email?: string
        customAttributes?: Record<string, string | number | boolean>
    }
): Promise<T> {
    if (!shouldUseNewRelic) {
        return handler()
    }

    setTransactionName(`API/${routeName}`)

    if (options?.userId || options?.email) {
        setUserAttributes(options.userId, options.email)
    }

    if (options?.customAttributes) {
        addCustomAttributes(options.customAttributes)
    }

    try {
        const result = await handler()
        return result
    } catch (error) {
        if (error instanceof Error) {
            noticeError(error, {
                route: routeName,
                ...(options?.customAttributes || {})
            })
        }
        throw error
    }
}

/**
 * Track database operation timing
 */
export function recordDbMetric(operation: string, duration: number) {
    if (shouldUseNewRelic) {
        newrelic.recordMetric(`Custom/Database/${operation}`, duration)
    }
}

/**
 * Track external service calls
 */
export function recordExternalCall(service: string, operation: string, duration: number) {
    if (shouldUseNewRelic) {
        newrelic.recordMetric(`Custom/External/${service}/${operation}`, duration)
    }
}

export { newrelic as newrelicAgent }