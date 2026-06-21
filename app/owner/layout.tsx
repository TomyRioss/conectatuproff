import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OwnerSidebar from "@/components/owner/Sidebar";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect("/owner/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "OWNER" && role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen" style={{ colorScheme: "light", background: "#F3F4F8", color: "#1A1A2E" }}>
      <OwnerSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
