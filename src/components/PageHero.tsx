import Breadcrumbs from "./Breadcrumbs";

interface PageHeroProps {
  badge: string;
  badgeIcon?: React.ReactNode;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  breadcrumbs: { label: string; href?: string }[];
}

export default function PageHero({
  badge,
  badgeIcon,
  title,
  titleAccent,
  subtitle,
  breadcrumbs,
}: PageHeroProps) {
  return (
    <section className="pt-32 md:pt-40 pb-16 md:pb-20 relative">
      {/* Subtle dot-grid background */}
      <div className="absolute inset-0 hero-dot-grid opacity-30 pointer-events-none" />

      <div className="w-[90%] mx-auto relative z-10">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
            {badgeIcon || (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L10 6L14 6.5L11 9.5L12 14L8 12L4 14L5 9.5L2 6.5L6 6L8 2Z"
                  stroke="#FF8400"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {badge}
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] tracking-tight mb-6">
          {titleAccent ? (
            <>
              <span className="font-display text-[#6E6E6A]">{titleAccent}</span>{" "}
              {title}
            </>
          ) : (
            title
          )}
        </h1>

        {subtitle && (
          <p className="text-[#6E6E6A] max-w-2xl text-lg md:text-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
