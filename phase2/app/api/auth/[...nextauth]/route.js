import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { userRepository } from "@/app/repo/repository";

 function randomNumberPassword() {
      const min = 100000; // Minimum 6-digit number
      const max = 999999; // Maximum 6-digit number
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

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
        const user = await userRepository.authenticate(credentials.username, credentials.password);
        if (user) {
          return {
            id: user.id,
            name: user.username,
            password: user.password,
            role: user.status,
            studentId: user.studentId,
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
        let user = await userRepository.findByUsername(username);
        if (!user) {
          user = await userRepository.create({
            username,
            password: randomNumberPassword(),
            status: "student",
          });
        }
        if(user.studentId === null && user.status === "student") {
          await userRepository.assignStudentIdIfMissing(user.username);
        }
        return {
          id: user.id.toString(),
          name: user.username,
          username: user.username,
          password: user.password,
          role: user.status,
          studentId: user.studentId,
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
        token.username = user.username || user.name;
        token.studentId = user?.studentId;
      }
      return token;
    },
    async session({ session, token }) {
        session.user.id = token.id;
        session.user.password = token.password;
        session.user.role = token.role;
        session.user.username = token.name || token.username;
        session.user.studentId = token.studentId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// ✅ THIS is the fix — export GET and POST functions from NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
