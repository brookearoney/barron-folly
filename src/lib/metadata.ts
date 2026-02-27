import { SITE_URL, SITE_NAME, CONTACT, SOCIAL } from "./constants";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/brand/logo-full.svg`,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT.email,
      contactType: "customer service",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: CONTACT.city,
      addressRegion: CONTACT.state,
      postalCode: CONTACT.zip,
      addressCountry: CONTACT.country,
    },
    sameAs: [SOCIAL.instagram, SOCIAL.linkedin],
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description:
      "Product design, mobile app development, web app development, and AI automation agency. Subscription-based with 48-hour turnarounds.",
    url: SITE_URL,
    email: CONTACT.email,
    priceRange: "$2500-$7500/month",
    address: {
      "@type": "PostalAddress",
      addressLocality: CONTACT.city,
      addressRegion: CONTACT.state,
      postalCode: CONTACT.zip,
      addressCountry: CONTACT.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "40.3769",
      longitude: "-111.7953",
    },
    sameAs: [SOCIAL.instagram, SOCIAL.linkedin],
  };
}

export function serviceJsonLd(service: {
  title: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: "United States",
    description: service.description,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; href?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}
