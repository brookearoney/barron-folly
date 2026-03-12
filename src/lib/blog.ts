import { createServerClient } from "@/lib/supabase/server";

export interface BlogSection {
  heading?: string;
  content: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  featured: boolean;
  author: string;
  heroImage: string;
  sections: BlogSection[];
  relatedSlugs: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    date: row.date,
    readTime: row.read_time,
    featured: row.featured,
    author: row.author,
    heroImage: row.hero_image,
    sections: row.sections ?? [],
    relatedSlugs: row.related_slugs ?? [],
    seo: {
      title: row.seo_title ?? "",
      description: row.seo_description ?? "",
      keywords: row.seo_keywords ?? [],
    },
  };
}

export async function getSortedPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });

    if (error) {
      console.error("getSortedPosts error:", error.message);
      return [];
    }
    return (data ?? []).map(mapRow);
  } catch (e) {
    console.error("getSortedPosts exception:", e);
    return [];
  }
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !data) return undefined;
    return mapRow(data);
  } catch {
    return undefined;
  }
}

export async function getAllBlogSlugs(): Promise<string[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("published", true);

    if (error) return [];
    return (data ?? []).map((row) => row.slug);
  } catch {
    return [];
  }
}

export async function getRelatedPosts(slugs: string[]): Promise<BlogPost[]> {
  if (!slugs.length) return [];
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .in("slug", slugs)
      .eq("published", true);

    if (error) return [];
    const posts = (data ?? []).map(mapRow);
    // Preserve the order of the input slugs
    return slugs
      .map((s) => posts.find((p) => p.slug === s))
      .filter((p): p is BlogPost => p !== undefined);
  } catch {
    return [];
  }
}

/** Returns up to 3 featured posts: those marked as featured, sorted by date */
export async function getFeaturedPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .eq("featured", true)
      .order("date", { ascending: false })
      .limit(3);

    if (error) return [];
    return (data ?? []).map(mapRow);
  } catch {
    return [];
  }
}

export async function getPostsByCategory(
  category: string
): Promise<BlogPost[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .eq("category", category)
      .order("date", { ascending: false });

    if (error) return [];
    return (data ?? []).map(mapRow);
  } catch {
    return [];
  }
}

export async function getAllCategories(): Promise<string[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("category")
      .eq("published", true);

    if (error) return [];
    const categories = (data ?? []).map((row) => row.category);
    return [...new Set(categories)];
  } catch {
    return [];
  }
}
