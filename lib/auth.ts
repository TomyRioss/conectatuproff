import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

        if ((credentials as { professionalOnly?: string }).professionalOnly === "true" && user.role !== "PROFESSIONAL") {
          throw new AuthError("NOT_PROFESSIONAL");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastActivity: new Date() },
        }).catch((e) => console.error("[auth] update lastActivity failed:", e));

        return { id: user.id, email: user.email ?? "", name: user.name, role: user.role, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
        const profile = await getProfile(user.id!, (user as { role: string }).role);
        token.picture = profile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : null;
        token.name = user.name ?? (profile ? `${profile.firstName} ${profile.lastName}` : null);
      }
      if (trigger === "update" && sessionUpdate?.image !== undefined) {
        token.picture = sessionUpdate.image;
      }
      if (trigger === "update" && sessionUpdate?.role !== undefined) {
        token.role = sessionUpdate.role;
        const profile = await getProfile(token.id as string, sessionUpdate.role);
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
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    // professionals are redirected to /profesional/login by the navbar
  },
});
