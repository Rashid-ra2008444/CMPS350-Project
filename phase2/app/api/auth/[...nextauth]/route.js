// /app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { userRepo } from "@/app/repo/repository";

export const authOptions = {
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
      async profile(profile) {
        const username = profile.login;
        let user = await userRepo.findByUsername(username);
        if (!user) {
          user = await userRepo.create({
            username,
            password: 111,
            status: "student",
          });
        }
        return {
          id: user.id.toString(),
          name: user.username,
          email: profile.email,
          image: profile.avatar_url,
          role: user.status,
          password: user.password,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.password = user.password;
        token.role = account?.provider === "github" ? "student" : user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.password = token.password;
      session.user.role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// ✅ THIS is the fix — export GET and POST functions from NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
