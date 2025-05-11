import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { userRepository } from "@/app/repo/repository"; // تأكد من صحة هذا المسار

function randomNumberPassword() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await userRepository.authenticate(credentials.username, credentials.password);
        if (user) {
          return {
            id: user.id,
            username: user.username,
            password: user.password,
            role: user.status,
            studentId: user.studentId,
          };
        }
        throw new Error("Invalid username or password");
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
        if (user.studentId === null && user.status === "student") {
          await userRepository.assignStudentIdIfMissing(user.username);
          user = await userRepository.findByUsername(user.username);
        }
        return {
          id: user.id.toString(),
          username: user.username,
          password: user.password,
          role: user.status,
          studentId: user.studentId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.password = user.password;
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        username: token.username,
        password: token.password,
        role: token.role,
        studentId: token.studentId,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
