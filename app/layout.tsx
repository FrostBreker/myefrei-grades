import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import Provider from "@components/Provider";
import {ReactNode} from "react";
import Script from "next/script";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "MyEFREI Grades - Tes notes EFREI, enfin claires",
    description: "Un petit projet étudiant pour consulter tes notes EFREI facilement. Simple, rapide, et gratuit !",
};

// Server-side only - evaluated once during build/render
const shouldInjectNewRelic =
    process.env.NODE_ENV === 'production' ||
    process.env.ENABLE_NEW_RELIC === "true";

// Get browser timing header only at runtime, not during build
let browserTimingHeader = '';

if (shouldInjectNewRelic && typeof window === 'undefined') {
    try {
        // Dynamic require to avoid loading during build
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const newrelic = require('newrelic');

        // Check if agent is connected
        if (newrelic.agent?.collector?.isConnected?.() === false) {
            // Wait for connection with timeout
            await Promise.race([
                new Promise<void>(resolve => newrelic.agent.on('connected', () => resolve())),
                new Promise<void>(resolve => setTimeout(resolve, 5000)) // 5s timeout
            ]);
        }

        browserTimingHeader = newrelic.getBrowserTimingHeader({
            hasToRemoveScriptWrapper: true,
            allowTransactionlessInjection: true
        }) || '';
    } catch {
        // New Relic not available during build - this is expected
        browserTimingHeader = '';
    }
}

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="fr" suppressHydrationWarning>
        <head>
            {/* Inject the New Relic Browser agent script */}
            {
                shouldInjectNewRelic && browserTimingHeader && (
                    <Script
                        id="nr-browser-agent"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{__html: browserTimingHeader}}
                    />
                )
            }
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <Provider>
            <main className="flex-1">
                {children}
            </main>
        </Provider>
        </body>
        </html>
    );
}