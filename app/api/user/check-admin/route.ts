import { NextResponse } from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@api/auth/[...nextauth]/route";
import {isAdmin} from "@lib/user/checkAdmin";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ isAdmin: false });
        }

        const userIsAdmin = await isAdmin();

        return NextResponse.json({ isAdmin: userIsAdmin });
    } catch (error) {
        console.error("Error checking admin:", error);
        return NextResponse.json({ isAdmin: false });
    }
}
