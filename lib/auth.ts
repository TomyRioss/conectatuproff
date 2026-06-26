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
        const role = (user as { role: string }).role;
        const profile = role === "CLIENT"
          ? await prisma.client.findUnique({ where: { userId: user.id! }, select: { avatarUrl: true } })
          : role === "PROFESSIONAL"
          ? await prisma.professional.findUnique({ where: { userId: user.id! }, select: { avatarUrl: true } })
          : null;
        const key = (profile as { avatarUrl?: string | null } | null)?.avatarUrl;
        token.picture = key ? `/api/avatar?key=${encodeURIComponent(key)}` : null;
      }
      if (trigger === "update" && sessionUpdate?.image !== undefined) {
        token.picture = sessionUpdate.image;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { role?: string }).role = token.role as string;
      session.user.image = token.picture as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    // professionals are redirected to /profesional/login by the navbar
  },
});
