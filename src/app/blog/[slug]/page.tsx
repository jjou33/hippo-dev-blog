import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostContent } from "./blog-post-content";
import { PostHeroSection } from "@/components/blog/hero-section";
import { AdminEditButton } from "@/components/blog/admin-edit-button";
import { AdminDeleteButton } from "@/components/blog/admin-delete-button";
import { ViewCounter } from "@/components/blog/view-counter";
import { getPostBySlug, getAllPosts, extractHeadings } from "@/lib/posts";
import { BlogPostAside } from "@/components/blog/blog-post-aside";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const post = getPostBySlug(decodeURIComponent(rawSlug));
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
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const tocItems = extractHeadings(post.content);

  return (
    <article className="min-w-0 flex-1">
      {post.heroImage && (
        <PostHeroSection src={post.heroImage} alt={post.title} />
      )}

      <div className="flex min-w-0">
        <div className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <header className="mb-8 border-b border-border pb-8">
            <div className="mb-3 flex items-center gap-2 text-base text-muted-foreground">
              {post.section && <span>{post.section}</span>}
              {post.section && post.category && <span>/</span>}
              {post.category && <span>{post.category}</span>}
              {post.category && post.subcategory && <span>/</span>}
              {post.subcategory && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {post.subcategory}
                </span>
              )}
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mb-5 text-xl text-muted-foreground">
                {post.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-base text-muted-foreground">
              {post.author && <span>{post.author}</span>}
              {post.author && post.date && <span>·</span>}
              {post.date && <time dateTime={post.date}>{post.date}</time>}
              <ViewCounter slug={slug} />
              <AdminEditButton slug={slug} />
              <AdminDeleteButton slug={slug} />
            </div>
          </header>

          <BlogPostContent content={post.content} />
        </div>

        {/* 오른쪽 TOC aside - 컨텐츠 영역에서만 표시 */}
        <BlogPostAside items={tocItems} />
      </div>
    </article>
  );
}
