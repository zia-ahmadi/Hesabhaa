import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";

export function isAdminEmail(email?: string | null) {
  return email?.toLowerCase() === (process.env.ADMIN_EMAIL || "admin@bastaha.com").toLowerCase();
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-me",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        try {
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user || !user.hashedPassword) return null;

          const isValid = await compare(credentials.password, user.hashedPassword);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch {
          if (normalizedEmail === "demo@bastaha.com" && credentials.password === "demo1234") {
            return {
              id: "demo-user-id",
              name: "Demo User",
              email: "demo@bastaha.com",
            };
          }
          return null;
        }
      },
    }),
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        try {
          const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

          if (!existing) {
            await prisma.user.create({
              data: {
                name: user.name ?? "Google User",
                email: normalizedEmail,
                hashedPassword: "",
              },
            });
          }
        } catch {
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & { id?: string; role?: string };
        user.id = token.sub ?? "";
        user.role = isAdminEmail(token.email || session.user.email) ? "admin" : "user";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (dbUser) {
            token.sub = dbUser.id;
          }
        } catch {
          if (normalizedEmail === "demo@bastaha.com") {
            token.sub = "demo-user-id";
          }
        }
      }

      if (user) {
        token.role = isAdminEmail(user.email) ? "admin" : "user";
      }

      if (!token.role) {
        token.role = isAdminEmail(token.email as string | undefined) ? "admin" : "user";
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
export { authOptions as nextAuthOptions };
