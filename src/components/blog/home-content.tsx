"use client";

import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import { PostCard } from "@/components/blog/post-card";
import { HorizontalPostCard } from "@/components/blog/horizontal-post-card";
import { TerminalIntro } from "@/components/blog/terminal-intro";
import {
  ICON_MAP,
  isCustomIcon,
  customIconSrc,
} from "@/components/blog/icon-picker";

// ── 서브카테고리 카드 ────────────────────────────────────────────────

interface SectionStat {
  title: string;
  section: string;
  category: string;
  icon?: string;
  count: number;
}

interface HomeContentProps {
  posts: BlogPost[];
}

function SectionIcon({ name }: { name: string }) {
  if (isCustomIcon(name)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={customIconSrc(name)} alt={name} className="h-4 w-4 shrink-0" />
    );
  }
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className="h-4 w-4 shrink-0" />;
}

function SectionCard({ section }: { section: SectionStat }) {
  const href = `/blog/subcategory/${encodeURIComponent(section.section)}/${encodeURIComponent(section.category)}/${encodeURIComponent(section.title)}`;
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-1 border-b border-border bg-muted/60 px-2 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-green-400" />
      </div>
      <div className="flex items-center justify-between px-2.5 py-2.5 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {section.icon && (
            <span className="shrink-0">
              <SectionIcon name={section.icon} />
            </span>
          )}
          <span className="truncate text-xs font-medium group-hover:text-primary transition-colors">
            {section.title}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {section.count}
        </span>
      </div>
    </Link>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────

export function HomeContent({ posts }: HomeContentProps) {
  const latestPosts = posts.slice(0, 4);
  const featuredPosts = posts.filter((p) => p.featured);

  const sectionMap = new Map<string, SectionStat>();
  for (const post of posts) {
    const key = `${post.section}||${post.category}||${post.subcategory}`;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        title: post.subcategory,
        section: post.section,
        category: post.category,
        icon: post.subcategoryIcon,
        count: 0,
      });
    }
    sectionMap.get(key)!.count++;
  }
  const sections = Array.from(sectionMap.values());

  return (
    <div className="space-y-16 px-4 py-12 lg:px-8">

      {/* ── 1. Hero: 터미널 ── */}
      <section>
        <TerminalIntro postCount={posts.length} />
      </section>

      {/* ── 2. 추천 포스트 ── */}
      {featuredPosts.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-bold tracking-tight">추천 포스트</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* ── 3. 최신 포스트 ── */}
      {latestPosts.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">최신 포스트</h2>
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {latestPosts.map((post) => (
              <HorizontalPostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. 서브카테고리 둘러보기 ── */}
      {sections.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-bold tracking-tight">서브카테고리 둘러보기</h2>
          <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sections.map((section) => (
              <SectionCard
                key={`${section.section}||${section.category}||${section.title}`}
                section={section}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
