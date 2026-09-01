import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

class AuthError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function getProfile(userId: string, role: string) {
  return role === "CLIENT"
    ? prisma.client.findUnique({ where: { userId }, select: { avatarUrl: true, firstName: true, lastName: true } })
    : role === "PROFESSIONAL"
    ? prisma.professional.findUnique({ where: { userId }, select: { avatarUrl: true, firstName: true, lastName: true } })
    : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;
        if (user.isBanned) throw new AuthError("BANNED");
        if (!user.isActive) throw new AuthError("PENDING_REVIEW");

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        // Which door was used decides the session mode — not the stored `role` —
        // since one account can have both a Client and a Professional profile.
        // Staff roles (ADMIN/SUPER_ADMIN/OWNER) have neither, so they bypass this.
        const professionalOnly = (credentials as { professionalOnly?: string }).professionalOnly === "true";
        const staffRoles = ["ADMIN", "SUPER_ADMIN", "OWNER"];
        let effectiveRole: string = user.role;

        if (!staffRoles.includes(user.role)) {
          if (professionalOnly) {
            const pro = await prisma.professional.findUnique({
              where: { userId: user.id },
              select: { isVerified: true },
            });
            if (!pro || (user.role !== "PROFESSIONAL" && !pro.isVerified)) throw new AuthError("NOT_PROFESSIONAL");
            if (!pro.isVerified) throw new AuthError("PENDING_REVIEW");
            effectiveRole = "PROFESSIONAL";
          } else {
            const client = await prisma.client.findUnique({
              where: { userId: user.id },
              select: { id: true },
            });
            if (!client) throw new AuthError("NOT_CLIENT");
            effectiveRole = "CLIENT";
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastActivity: new Date() },
        }).catch((e) => console.error("[auth] update lastActivity failed:", e));

        return { id: user.id, email: user.email ?? "", name: user.name, role: effectiveRole, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      // New Google user: no DB row yet, nothing to check (events.createUser below
      // creates their Client profile). Existing users: just block banned accounts —
      // role doesn't matter, an account can be professional AND client at once.
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { isBanned: true },
      });
      if (dbUser?.isBanned) return "/login?error=BANNED";

      return true;
    },
    async jwt({ token, user, trigger, session: sessionUpdate, account }) {
      if (user) {
        token.id = user.id!;
        // Google button only lives on the client login/register pages — always CLIENT.
        token.role = account?.provider === "google" ? "CLIENT" : (user as { role: string }).role;
        const profile = await getProfile(user.id!, token.role as string);
        token.picture = profile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : null;
        token.name = user.name ?? (profile ? `${profile.firstName} ${profile.lastName}` : null);
        // Google users land without username/password — force a completion step.
        const acct = await prisma.user.findUnique({
          where: { id: user.id! },
          select: { username: true, password: true },
        });
        token.needsSetup = !acct?.username || !acct?.password;
      }
      if (trigger === "update") {
        const acct = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, password: true },
        });
        token.needsSetup = !acct?.username || !acct?.password;
      }
      if (trigger === "update" && sessionUpdate?.image !== undefined) {
        token.picture = sessionUpdate.image;
      }
      if (trigger === "update" && sessionUpdate?.role !== undefined && sessionUpdate.role !== token.role) {
        // Never trust the client-provided role: always verify against the DB.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        let nextRole = dbUser?.role === sessionUpdate.role ? sessionUpdate.role : (token.role as string);
        if (!nextRole || typeof nextRole !== "string") nextRole = "CLIENT";
        token.role = nextRole;
        const profile = await getProfile(token.id as string, nextRole);
        token.picture = profile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : null;
        if (!token.name && profile) token.name = `${profile.firstName} ${profile.lastName}`;
      }
      if (!token.name && token.id) {
        const profile = await getProfile(token.id as string, token.role as string);
        if (profile) token.name = `${profile.firstName} ${profile.lastName}`;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { role?: string }).role = token.role as string;
      session.user.image = token.picture as string | null;
      session.user.name = token.name as string | null;
      (session.user as { needsSetup?: boolean }).needsSetup = token.needsSetup === true;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const [firstName, ...rest] = (user.name ?? "").trim().split(/\s+/);
      await prisma.client.create({
        data: { userId: user.id, firstName: firstName || "Usuario", lastName: rest.join(" ") },
      }).catch((e) => console.error("[auth] create Client from Google failed:", e));
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    // professionals are redirected to /profesional/login by the navbar
  },
});
