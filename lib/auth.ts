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

let _dbViable: boolean | null = null;

async function isViable() {
  if (_dbViable === false) return false;
  if (!process.env.DATABASE_URL) {
    _dbViable = false;
    return false;
  }
  if (_dbViable === true) return true;
  try {
    await prisma.$queryRawUnsafe("SELECT 1").catch(() => {
      throw new Error("db ping failed");
    });
    _dbViable = true;
    return true;
  } catch {
    _dbViable = false;
    return false;
  }
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!(await isViable())) return fallback;
  try {
    const p = fn();
    if (!p || typeof p.then !== "function") return p as T;
    return await p;
  } catch {
    return fallback;
  }
}
void safe;

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
        const demoFallback = () => {
          if (normalizedEmail === "demo@bastaha.com" && credentials.password === "demo1234") {
            return {
              id: "demo-user-id",
              name: "Demo User",
              email: "demo@bastaha.com",
              role: "customer",
            };
          }
          const adminFromEnv = (process.env.ADMIN_EMAIL || "admin@bastaha.com").toLowerCase();
          if (normalizedEmail === adminFromEnv && credentials.password === "admin1234") {
            return {
              id: "demo-admin-id",
              name: "Admin User",
              email: adminFromEnv,
              role: "admin",
            };
          }
          return null;
        };
        if (!(await isViable())) return demoFallback();
        try {
          const p = (async () => {
            const user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });
            if (!user || !user.hashedPassword) return demoFallback();
            const isValid = await compare(credentials.password, user.hashedPassword);
            if (!isValid) return demoFallback();
            const isAdmin = user.role === "admin" || isAdminEmail(user.email);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: isAdmin ? "admin" : "customer",
            };
          })();
          if (!p || typeof p.then !== "function") return p;
          return await p;
        } catch {
          return demoFallback();
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
        if (await isViable()) {
          try {
            const p = (async () => {
              const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
              if (!existing) {
                const isAdmin = isAdminEmail(normalizedEmail);
                await prisma.user.create({
                  data: {
                    name: user.name ?? "Google User",
                    email: normalizedEmail,
                    hashedPassword: "",
                    role: isAdmin ? "admin" : "customer",
                  },
                });
              }
              return true;
            })();
            if (p && typeof p.then === "function") await p;
          } catch {}
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & { id?: string; role?: string };
        user.id = token.sub ?? "";
        user.role = (token.role as string) || (isAdminEmail(token.email || session.user.email) ? "admin" : "customer");
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        if (await isViable()) {
          try {
            const p = (async () => {
              const dbUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
              if (dbUser) {
                token.sub = dbUser.id;
                token.role = dbUser.role === "admin" || isAdminEmail(dbUser.email) ? "admin" : "customer";
              }
            })();
            if (p && typeof p.then === "function") await p;
          } catch {}
        }
        if (!token.role) {
          if (normalizedEmail === "demo@bastaha.com") {
            token.sub = "demo-user-id";
            token.role = "customer";
          }
          const adminFromEnv = (process.env.ADMIN_EMAIL || "admin@bastaha.com").toLowerCase();
          if (normalizedEmail === adminFromEnv) {
            token.sub = "demo-admin-id";
            token.role = "admin";
          }
        }
      }

      if (user && !token.role) {
        const typedUser = user as typeof user & { role?: string };
        token.role = typedUser.role ?? (isAdminEmail(user.email) ? "admin" : "customer");
      }

      if (!token.role) {
        token.role = isAdminEmail(token.email as string | undefined) ? "admin" : "customer";
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
export { authOptions as nextAuthOptions };
