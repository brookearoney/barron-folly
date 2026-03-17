import FirecrawlApp from "@mendable/firecrawl-js";

export interface FirecrawlResult {
  text: string;
  title: string;
  rawHtml: string;
  metadata: Record<string, unknown>;
}

/**
 * Scrape a URL using Firecrawl (preferred) with a simple fetch fallback.
 */
export async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    // Fallback to simple fetch if no Firecrawl key
    return simpleScrape(url);
  }

  try {
    const app = new FirecrawlApp({ apiKey });
    const result = await app.scrapeUrl(url, {
      formats: ["markdown"],
    });

    if (!result.success) {
      console.warn("Firecrawl scrape failed, falling back to simple scrape:", result);
      return simpleScrape(url);
    }

    const markdown = result.markdown || "";
    const cleanedText = cleanScrapedContent(markdown);

    return {
      text: cleanedText,
      title: result.metadata?.title || "",
      rawHtml: markdown, // Firecrawl returns markdown, store it as the "raw" content
      metadata: result.metadata || {},
    };
  } catch (err) {
    console.warn("Firecrawl error, falling back to simple scrape:", err);
    return simpleScrape(url);
  }
}

/**
 * Clean up scraped content by removing common noise patterns.
 */
function cleanScrapedContent(text: string): string {
  let clean = text;

  // Remove cookie consent banners
  clean = clean.replace(
    /(?:we use cookies|cookie policy|accept cookies|cookie consent|by continuing to use)[^\n]*\n?/gi,
    ""
  );

  // Remove common nav/footer noise patterns in markdown
  clean = clean.replace(/^\s*(?:skip to (?:main )?content|jump to navigation)\s*$/gim, "");

  // Remove excessive link-only lines (common in nav sections)
  clean = clean.replace(/^(\[.+?\]\(.+?\)\s*){5,}$/gm, "");

  // Remove repetitive social media links
  clean = clean.replace(
    /(?:follow us on|connect with us|find us on)\s*(?:facebook|twitter|instagram|linkedin|youtube)[^\n]*\n?/gi,
    ""
  );

  // Collapse multiple blank lines
  clean = clean.replace(/\n{4,}/g, "\n\n\n");

  return clean.trim();
}

/**
 * Simple fetch fallback when Firecrawl is not available.
 */
async function simpleScrape(url: string): Promise<FirecrawlResult> {
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

    let html = await res.text();
    const MAX_BODY_SIZE = 200_000;
    if (html.length > MAX_BODY_SIZE) {
      html = html.slice(0, MAX_BODY_SIZE);
    }

    const title = extractTag(html, "title");
    const text = stripHtmlToText(html);

    return {
      text,
      title,
      rawHtml: html,
      metadata: {
        source: "simple_scrape",
        contentLength: html.length,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractTag(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function stripHtmlToText(html: string): string {
  let clean = html;
  const tagsToRemove = ["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"];
  for (const tag of tagsToRemove) {
    clean = clean.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "gi"), " ");
  }
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}
