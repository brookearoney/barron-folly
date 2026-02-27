import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/data/projects";

export default function ProjectNav({
  prev,
  next,
}: {
  prev: Project | null;
  next: Project | null;
}) {
  return (
    <section className="border-t border-[#2A2A26]/30 py-16">
      <div className="w-[90%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prev && (
            <Link
              href={`/work/${prev.slug}`}
              className="group flex items-center gap-6 p-6 rounded-2xl border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[#6E6E6A] group-hover:text-[#FF8400] transition-colors shrink-0"
              >
                <path
                  d="M13 8H3M3 8L7 4M3 8L7 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={prev.image}
                  alt={prev.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-1">
                  Previous
                </p>
                <p className="text-white font-medium group-hover:text-[#FF8400] transition-colors">
                  {prev.title}
                </p>
              </div>
            </Link>
          )}

          {next && (
            <Link
              href={`/work/${next.slug}`}
              className="group flex items-center justify-end gap-6 p-6 rounded-2xl border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all md:col-start-2"
            >
              <div className="text-right">
                <p className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-1">
                  Next
                </p>
                <p className="text-white font-medium group-hover:text-[#FF8400] transition-colors">
                  {next.title}
                </p>
              </div>
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={next.image}
                  alt={next.title}
                  fill
                  className="object-cover"
                />
              </div>
              <svg
                width="24"
                height="24"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[#6E6E6A] group-hover:text-[#FF8400] transition-colors shrink-0"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
