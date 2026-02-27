import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group relative rounded-2xl overflow-hidden border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all duration-700 block"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-[#141412]/20 to-transparent" />

        {/* Tags overlay */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 text-xs bg-[#0A0A08]/70 backdrop-blur-sm border border-[#2A2A26]/50 rounded-full text-[#9E9E98]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-6 md:p-8">
        <p className="text-sm text-[#6E6E6A] mb-2">{project.subtitle}</p>
        <h3 className="text-2xl md:text-3xl font-light group-hover:text-[#FF8400] transition-colors duration-500">
          {project.title}
        </h3>
      </div>
    </Link>
  );
}
