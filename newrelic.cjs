/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

/**
 * New Relic agent configuration.
 */
exports.config = {
    app_name: [process.env.NEW_RELIC_APP_NAME || 'myEfreiGrades-Server-Dev'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,

    application_logging: {
        forwarding: {
            enabled: true,
        },
    },

    distributed_tracing: {
        enabled: true,
    },

    // Better handling for serverless/Docker environments
    utilization: {
        detect_aws: true,
        detect_docker: true,
    },

    // Transaction tracer settings
    transaction_tracer: {
        enabled: true,
        record_sql: 'obfuscated',
        explain_threshold: 500, // ms
    },

    // Error collector settings
    error_collector: {
        enabled: true,
        ignore_status_codes: [404],
    },

    // Browser monitoring settings
    browser_monitoring: {
        enabled: true,
        attributes: {
            enabled: true,
        },
    },

    // Custom attributes settings
    attributes: {
        enabled: true,
        include: [
            'request.headers.userAgent',
            'request.headers.referer',
        ],
    },

    // Logging configuration
    logging: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
        filepath: process.env.NODE_ENV === 'production'
            ? 'stdout'
            : require('path').join(process.cwd(), 'newrelic_agent.log'),
    },
}