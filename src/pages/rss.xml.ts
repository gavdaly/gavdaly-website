import { getCollection } from "astro:content";

import { SITE_URL } from "@/data/config";

const escapeXml = (value: string) =>
  value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );

export async function GET() {
  const posts = (await getCollection("posts")).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
  const items = posts
    .map((post) => {
      const url = new URL(`/posts/${post.id}`, SITE_URL).toString();
      return `<item><title>${escapeXml(post.data.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(post.data.description.replaceAll("**", ""))}</description><pubDate>${post.data.publishedAt.toUTCString()}</pubDate></item>`;
    })
    .join("");
  const feed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Gavin Daly</title><link>${SITE_URL}</link><description>Writing by Gavin Daly about software, infrastructure, privacy, and security.</description>${items}</channel></rss>`;
  return new Response(feed, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
