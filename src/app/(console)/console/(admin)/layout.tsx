import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/console/admin-helpers";
import AdminShell from "@/components/console/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();

  if (!ctx) {
    redirect("/console/dashboard");
  }

  return <AdminShell profile={ctx.profile}>{children}</AdminShell>;
}
