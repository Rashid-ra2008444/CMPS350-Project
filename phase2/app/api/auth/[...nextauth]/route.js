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
      },
      async authorize(credentials) {
        const user = await userRepo.authenticate(credentials.username, credentials.password);
        if (user) {
          return {
            id: user.id.toString(),
            name: user.username,
            email: user.username,
            role: user.status, 
            studentId: user.password.toString(),
          };
        }
        return null;
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
            password: Math.floor(Math.random() * 9000000) + 1000000,
            status: "student",
          });
        }
        return {
          id: user.id.toString(),
          name: user.username,
          email: profile.email,
          image: profile.avatar_url,
          role: user.status, 
          studentId: user.password.toString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; 
        token.studentId = user.studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role; 
        session.user.studentId = token.studentId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', 
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };