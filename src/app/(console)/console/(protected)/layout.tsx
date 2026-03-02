import { redirect } from "next/navigation";
import { getConsoleContext } from "@/lib/console/helpers";
import ConsoleShell from "@/components/console/ConsoleShell";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getConsoleContext();

  if (!ctx) {
    redirect("/console/login");
  }

  return (
    <ConsoleShell
      profile={ctx.profile}
      organization={ctx.organization}
      pendingCounts={ctx.pendingCounts}
    >
      {children}
    </ConsoleShell>
  );
}
