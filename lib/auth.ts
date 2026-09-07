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
        // El botón de Google vive tanto en la puerta de cliente como en la de
        // profesional. Resolver el rol contra la DB: cliente si tiene ese perfil,
        // si no profesional verificado, si no cliente (usuario nuevo).
        if (account?.provider === "google") {
          const gClient = await prisma.client.findUnique({ where: { userId: user.id! }, select: { id: true } });
          if (gClient) {
            token.role = "CLIENT";
          } else {
            const gPro = await prisma.professional.findUnique({ where: { userId: user.id! }, select: { isVerified: true } });
            token.role = gPro?.isVerified ? "PROFESSIONAL" : "CLIENT";
          }
        } else {
          token.role = (user as { role: string }).role;
        }
        const profile = await getProfile(user.id!, token.role as string);
        const externalImage = typeof user.image === "string" && user.image.startsWith("http") ? user.image : null;
        token.picture = profile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : externalImage;
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
          select: { username: true, password: true, image: true },
        });
        token.needsSetup = !acct?.username || !acct?.password;
        if (!token.picture) {
          const profile = await getProfile(token.id as string, token.role as string);
          const updExternal = acct?.image?.startsWith("http") ? acct.image : null;
          token.picture = profile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : updExternal;
        }
      }
      if (trigger === "update" && sessionUpdate?.image !== undefined) {
        token.picture = sessionUpdate.image;
      }
      if (trigger === "update" && sessionUpdate?.role !== undefined && sessionUpdate.role !== token.role) {
        // Never trust the client-provided role: verify the matching profile exists.
        // An account can be Client AND Professional at once, so gate on profile
        // existence/verification — not the single `user.role` column.
        const requested = sessionUpdate.role;
        let allowed = false;
        if (requested === "PROFESSIONAL") {
          const pro = await prisma.professional.findUnique({
            where: { userId: token.id as string },
            select: { isVerified: true },
          });
          allowed = pro?.isVerified === true;
        } else if (requested === "CLIENT") {
          const client = await prisma.client.findUnique({
            where: { userId: token.id as string },
            select: { id: true },
          });
          allowed = client !== null;
        }
        let nextRole = allowed ? requested : (token.role as string);
        if (!nextRole || typeof nextRole !== "string") nextRole = "CLIENT";
        token.role = nextRole;
        const profile = await getProfile(token.id as string, nextRole);
        const roleUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { image: true } });
        const roleExternal = roleUser?.image?.startsWith("http") ? roleUser.image : null;
        token.picture = profile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : roleExternal;
        if (!token.name && profile) token.name = `${profile.firstName} ${profile.lastName}`;
      }
      if (!token.name && token.id) {
        const profile = await getProfile(token.id as string, token.role as string);
        if (profile) token.name = `${profile.firstName} ${profile.lastName}`;
      }

      // El JWT no se entera si el equipo archiva/banea la cuenta después del login.
      // Revalidar contra la DB de forma periódica y marcar el token como bloqueado.
      // ponytail: recheck cada 60s; bajar el intervalo si se necesita cortar antes.
      if (token.id) {
        const RECHECK_MS = 60_000;
        const lastCheck = typeof token.checkedAt === "number" ? token.checkedAt : 0;
        if (Date.now() - lastCheck > RECHECK_MS) {
          const acct = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, isBanned: true, image: true, client: { select: { id: true } } },
          });
          token.checkedAt = Date.now();
          const proHit = !acct || acct.isBanned ? "BANNED" : !acct.isActive ? "PENDING_REVIEW" : null;
          const hasClient = !!acct?.client;

          if (!proHit) {
            token.blocked = null;
            token.proBlocked = null;
            const currentProfile = await getProfile(token.id as string, token.role as string);
            const freshExternal = acct?.image?.startsWith("http") ? acct.image : null;
            const fresh = currentProfile?.avatarUrl ? `/api/avatar?key=${encodeURIComponent(currentProfile.avatarUrl)}` : freshExternal;
            if (fresh !== token.picture) token.picture = fresh;
          } else if (hasClient && (token.role === "PROFESSIONAL" || token.proBlocked)) {
            // Cuenta profesional bloqueada/archivada pero existe perfil de cliente:
            // continuar la sesión como cliente y avisar con un modal en "/".
            token.role = "CLIENT";
            token.blocked = null;
            token.proBlocked = proHit;
            const profile = await getProfile(token.id as string, "CLIENT");
            if (profile) {
              const acctExternal = acct?.image?.startsWith("http") ? acct.image : null;
              token.picture = profile.avatarUrl ? `/api/avatar?key=${encodeURIComponent(profile.avatarUrl)}` : acctExternal;
              token.name = `${profile.firstName} ${profile.lastName}`;
            }
          } else {
            token.blocked = proHit;
            token.proBlocked = null;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      const blocked = (token.blocked as string | null) ?? null;
      (session.user as { blocked?: string | null }).blocked = blocked;
      (session.user as { proBlocked?: string | null }).proBlocked = (token.proBlocked as string | null) ?? null;
      // Cuenta archivada/baneada sin perfil de cliente: se le quita el rol para que
      // toda ruta protegida (páginas y APIs que chequean role) la rechace.
      (session.user as { role?: string }).role = blocked ? "BLOCKED" : (token.role as string);
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
