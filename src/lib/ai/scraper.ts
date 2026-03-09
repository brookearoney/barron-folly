/**
 * Simple URL scraper that fetches a page and extracts text content.
 * Strips nav, footer, scripts, styles, and other boilerplate.
 */

export interface ScrapeResult {
  text: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  rawHtml: string;
}

const MAX_BODY_SIZE = 200_000; // 200KB limit

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  // Normalize URL
  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BarronFollyBot/1.0; +https://barronfolly.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error(`URL did not return HTML (got ${contentType})`);
    }

    let html = await res.text();
    if (html.length > MAX_BODY_SIZE) {
      html = html.slice(0, MAX_BODY_SIZE);
    }

    const title = extractTag(html, "title");
    const metaDescription = extractMeta(html, "description");
    const metaKeywords = extractMeta(html, "keywords");
    const text = stripHtmlToText(html);

    return { text, title, metaDescription, metaKeywords, rawHtml: html };
  } finally {
    clearTimeout(timeout);
  }
}

function extractTag(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractMeta(html: string, name: string): string {
  const match = html.match(
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")
  );
  if (match) return match[1].trim();
  // Try reversed attribute order
  const match2 = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i")
  );
  return match2 ? match2[1].trim() : "";
}

function stripHtmlToText(html: string): string {
  // Remove elements that add noise
  let clean = html;
  const tagsToRemove = ["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"];
  for (const tag of tagsToRemove) {
    clean = clean.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "gi"), " ");
  }
  // Remove all HTML tags
  clean = clean.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}
