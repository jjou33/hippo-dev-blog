import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      role: "admin" | "visitor";
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    session({ session }) {
      session.user.role =
        session.user.email === process.env.ADMIN_EMAIL ? "admin" : "visitor";
      return session;
    },
  },
});
