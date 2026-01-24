import NextAuth, {AuthOptions} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {MongoDBAdapter} from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";

const clientId: string | undefined = process.env.GOOGLE_CLIENT_ID;
const clientSecret: string | undefined = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
}

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: clientId,
            clientSecret: clientSecret,
        }),
    ],
    adapter: MongoDBAdapter(clientPromise),
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            return true
        },
        async redirect({ url, baseUrl }) {
            return baseUrl
        },
        async session({ session, user, token }) {
            return session
        },
        async jwt({ token, user, account, profile, isNewUser }) {
            return token
        }
    },
};

const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};