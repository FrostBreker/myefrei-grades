import { NextResponse } from "next/server";
import {requestAdminCheck} from "@lib/api/request_check";

export async function GET() {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

        return NextResponse.json({ isAdmin: isAuthorized });
    } catch (error) {
        console.error("Error checking admin:", error);
        return NextResponse.json({ isAdmin: false });
    }
}
