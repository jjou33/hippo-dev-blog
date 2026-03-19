import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/blog/header";
import { Sidebar } from "@/components/blog/sidebar";
import { MobileSidebar } from "@/components/blog/mobile-sidebar";
import { BlogPostContent } from "./blog-post-content";
import { getPostBySlug, getAllPosts, getNavigationFromPosts } from "@/lib/posts";
import { logo } from "@/lib/blog-data";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "포스트를 찾을 수 없습니다" };

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const navigationData = getNavigationFromPosts(slug);
  const allPosts = getAllPosts();

  const visitorStats = { today: 100, total: 1000 };

  return (
    <div className="min-h-screen bg-background">
      <Header posts={allPosts} />

      <div className="max-w-full px-2 lg:px-3">
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar sections={navigationData} logo={logo} visitorStats={visitorStats} />

          {/* Main Content */}
          <article className="min-w-0 flex-1 px-4 py-8 lg:px-8">
            {/* Post Header */}
            <header className="mb-8 border-b border-border pb-8">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                {post.section && <span>{post.section}</span>}
                {post.section && post.category && <span>/</span>}
                {post.category && (
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                    {post.category}
                  </span>
                )}
              </div>
              <h1 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">
                {post.title}
              </h1>
              {post.description && (
                <p className="mb-4 text-lg text-muted-foreground">
                  {post.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {post.author && <span>{post.author}</span>}
                {post.author && post.date && <span>·</span>}
                {post.date && <time dateTime={post.date}>{post.date}</time>}
              </div>
            </header>

            {/* Post Content */}
            <BlogPostContent content={post.content} />
          </article>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar sections={navigationData} />
    </div>
  );
}
