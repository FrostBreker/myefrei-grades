import { NextResponse } from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@api/auth/[...nextauth]/route";
import {isAdmin} from "@lib/user/checkAdmin";
import { instrumentApiRoute, noticeError } from "@lib/newrelic";

export async function GET() {
    return instrumentApiRoute('user/check-admin/GET', async () => {
        try {
            const session = await getServerSession(authOptions);
            if (!session || !session.user?.email) {
                return NextResponse.json({ isAdmin: false });
            }

            const userIsAdmin = await isAdmin();

            return NextResponse.json({ isAdmin: userIsAdmin });
        } catch (error) {
            console.error("Error checking admin:", error);
            if (error instanceof Error) noticeError(error, { route: 'user/check-admin/GET' });
            return NextResponse.json({ isAdmin: false });
        }
    });
}
