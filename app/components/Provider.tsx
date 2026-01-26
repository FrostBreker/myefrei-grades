"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import {ReactNode} from "react";
import Footer from "@components/main_components/Footer";
import Navbar from "@components/main_components/Navbar";

export default function Provider({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <Navbar />
                {children}
                <Footer />
            </ThemeProvider>
        </SessionProvider>
    )
}