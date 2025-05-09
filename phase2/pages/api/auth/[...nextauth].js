// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { userRepo } from "@/app/repo/repository"; // adjust the path as needed

const authOptions = {
    providers: [
        // CredentialsProvider({
        //     name: "Credentials",
        //     credentials: {
        //         username: { label: "Username", type: "text" },
        //         password: { label: "Password", type: "password" },
        //         status: { label: "status", type: "status" },
        //     },
        //     async authorize(credentials) {
        //         const user = await userRepo.authenticate(credentials.username, credentials.password);
        //         if (user) {
        //             return {
        //                 id: user.id,
        //                 name: user.username,
        //                 password: user.password,
        //                 role: user.status,
        //             };
        //         }
        //         return null; // Login failed
        //     },
        // }),
        GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,

            async profile(githubProfile) {
                const ghUsername = githubProfile.login;

                // 1) Look for an existing user in your Prisma DB
                let dbUser = await userRepo.findByUsername(ghUsername);

                // 2) If none exists, create one with default password “111”
                if (!dbUser) {
                    dbUser = await userRepo.create({
                        username: ghUsername,
                        password: 111,
                        status: "student",      // or whatever default role you want
                    });
                }

                // 3) Return an object that NextAuth will treat as the “user”
                return {
                    id: dbUser.id.toString(),
                    name: dbUser.username,
                    email: githubProfile.email,
                    image: githubProfile.avatar_url,
                    role: dbUser.status,
                    password: dbUser.password,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                // always keep the user’s id & password
                token.id = user.id;
                token.password = user.password;

                // if this sign-in was via GitHub, force role="student",
                // otherwise use whatever role the DB returned
                token.role = account?.provider === "github"
                    ? "student"
                    : user.role;
            }
            return token;
        },

        // Expose them in the session
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.password = token.password;
            session.user.role = token.role;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
export { authOptions };
