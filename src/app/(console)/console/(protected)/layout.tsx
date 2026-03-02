import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getConsoleContext } from "@/lib/console/helpers";
import ConsoleShell from "@/components/console/ConsoleShell";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getConsoleContext();

  // Not authenticated at all
  if (!ctx) {
    redirect("/console/login");
  }

  // Authenticated but no organization assigned yet
  if (!ctx.organization) {
    // Admins can go straight to admin portal
    if (ctx.profile.role === "admin") {
      redirect("/console/admin");
    }

    // Clients without an org see a waiting screen
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Image
            src="/images/brand/fox-icon-cream.svg"
            alt="Barron & Folly"
            width={48}
            height={48}
            className="mx-auto mb-6"
          />
          <h1 className="text-xl font-semibold text-foreground mb-3">
            Welcome to B&F Console
          </h1>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            Your account has been created but hasn&apos;t been assigned to an
            organization yet. The Barron & Folly team will set this up for you
            shortly.
          </p>
          <p className="text-muted text-xs">
            Questions?{" "}
            <Link
              href="mailto:hello@barronfolly.com"
              className="text-orange hover:underline"
            >
              hello@barronfolly.com
            </Link>
          </p>
        </div>
      </div>
    );
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
