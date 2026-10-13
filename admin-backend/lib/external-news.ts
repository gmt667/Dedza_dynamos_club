type WordpressPost = {
  id: number;
  date: string;
  link: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
};

const feeds = [
  "https://fam.mw/wp-json/wp/v2/posts?search=Dedza&per_page=8&_fields=id,date,link,title,excerpt",
  "https://sulommw.com/wp-json/wp/v2/posts?search=Dedza&per_page=8&_fields=id,date,link,title,excerpt",
];

const clean = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&#8217;|&rsquo;/gi, "'")
  .replace(/&#8211;|&ndash;/gi, "-")
  .replace(/&quot;/gi, '"')
  .replace(/\s+/g, " ")
  .trim();

async function fetchFeed(url: string) {
  const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "DedzaDynamosOfficialSite/1.0" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return [];
  const posts = await response.json() as WordpressPost[];
  return posts.map((post) => ({
    id: `feed-${post.id}-${new URL(url).hostname}`,
    title: clean(post.title?.rendered),
    summary: clean(post.excerpt?.rendered).slice(0, 400),
    publishedAt: post.date,
  })).filter((post) => post.title && post.summary);
}

export async function getExternalNews() {
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const unique = new Map<string, Awaited<ReturnType<typeof fetchFeed>>[number]>();
  for (const result of results) if (result.status === "fulfilled") for (const post of result.value) unique.set(post.title.toLowerCase(), post);
  return [...unique.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 12);
}
