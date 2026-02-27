import Link from "next/link";
import AnimateIn from "./AnimateIn";
import type { Service } from "@/data/services";

export default function ServiceCard({
  service,
  index = 0,
}: {
  service: Service;
  index?: number;
}) {
  return (
    <AnimateIn delay={index * 0.1}>
      <Link
        href={`/services/${service.slug}`}
        className="group p-8 md:p-10 border-b border-r border-[#2A2A26]/30 hover:bg-[#171614]/60 transition-all duration-500 h-full block"
      >
        <div className="mb-6 w-14 h-14 rounded-xl bg-[#171614] border border-[#2A2A26]/50 flex items-center justify-center group-hover:border-[#FF8400]/30 transition-colors">
          <span className="text-[#FF8400] text-base font-light">
            {service.num}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-3 leading-snug group-hover:text-[#FF8400] transition-colors">
          {service.title}
        </h3>
        <p className="text-[#6E6E6A] text-sm leading-relaxed mb-5">
          {service.desc}
        </p>
        <div className="flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs text-[#6E6E6A] border border-[#2A2A26]/50 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </AnimateIn>
  );
}
