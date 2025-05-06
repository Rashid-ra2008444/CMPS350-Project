// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { userRepo } from "@/app/repo/repository"; // adjust the path as needed

const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
                status: { label: "status", type: "status" },
            },
            async authorize(credentials) {
                const user = await userRepo.authenticate(credentials.username, credentials.password);
                if (user) {
                    return {
                        id: user.id,
                        name: user.username,
                        password: user.password,
                        role: user.status,
                    };
                }
                return null; // Login failed
            },
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role || "student";
                token.password = user.password;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.role = token.role;
            session.user.password = token.password;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
export { authOptions };
