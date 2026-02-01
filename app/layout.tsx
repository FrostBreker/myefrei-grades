import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import Provider from "@components/Provider";
import {ReactNode} from "react";

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

export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="fr" suppressHydrationWarning>
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
