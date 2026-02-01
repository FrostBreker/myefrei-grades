import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import Provider from "@components/Provider";
import {ReactNode} from "react";
import Script from "next/script";
import newrelic from 'newrelic'

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

// Type assertion for New Relic agent internals (not fully typed)
const nrAgent = newrelic as unknown as {
    agent: {
        collector: { isConnected: () => boolean };
        on: (event: string, callback: () => void) => void;
    };
};

// Wait for New Relic Node agent to connect
if (shouldInjectNewRelic && nrAgent.agent?.collector?.isConnected() === false) {
    await new Promise<void>(resolve => nrAgent.agent.on('connected', () => resolve()));
}

// Get the browser agent <script> tag (no wrapper tags)
const browserTimingHeader = shouldInjectNewRelic
    ? newrelic.getBrowserTimingHeader({
        hasToRemoveScriptWrapper: true,
        allowTransactionlessInjection: true
    })
    : '';

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="fr" suppressHydrationWarning>
        <head>
            {/* Inject the New Relic Browser agent script */}
            {
                shouldInjectNewRelic && (
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