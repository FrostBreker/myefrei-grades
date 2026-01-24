"use client";

import { SessionProvider } from "next-auth/react";
import {ReactNode} from "react";
import Footer from "@components/main_components/Footer";
import Navbar from "@components/main_components/Navbar";

export default function Provider({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <SessionProvider>
            <Navbar />
            {children}
            <Footer />
        </SessionProvider>
    )
}