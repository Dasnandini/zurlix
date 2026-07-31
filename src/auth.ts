import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const runtime = "nodejs";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account?.provider) {
        return true;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (!existingUser) {
        return true;
      }

      const alreadyLinkedToThisProvider = existingUser.accounts.some(
        (existingAccount) => existingAccount.provider === account.provider
      );

      if (alreadyLinkedToThisProvider) {
        return true;
      }

      const existingProvider = existingUser.accounts.find(
        (existingAccount) =>
          existingAccount.provider === "google" ||
          existingAccount.provider === "github"
      )?.provider;

      if (existingProvider && existingProvider !== account.provider) {
        return `/login?error=OAuthAccountExists:${existingProvider}`;
      }

      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
});