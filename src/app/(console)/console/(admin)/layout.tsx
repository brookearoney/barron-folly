import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/console/admin-helpers";
import AdminShell from "@/components/console/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();

  if (!ctx) {
    redirect("/console/login");
  }

  return <AdminShell profile={ctx.profile}>{children}</AdminShell>;
}
