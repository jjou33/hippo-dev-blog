import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/types/blog";

const TAG_COLORS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      {/* macOS 윈도우 헤더 */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2 shrink-0">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        {/* URL 바 스타일 */}
        <div className="ml-2 flex-1 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground truncate">
          hippo-docs/{post.slug}
        </div>
      </div>

      {/* 썸네일 영역 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {post.heroImage ? (
          <div className="absolute inset-2 overflow-hidden rounded-lg">
            {post.heroImageFit === "contain" ? (
              <>
                {/* 블러 배경 */}
                <Image
                  src={post.heroImage}
                  alt=""
                  fill
                  aria-hidden
                  className="object-cover scale-110 blur-sm opacity-40"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* 실제 이미지 - 전체 표시 */}
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </>
            ) : (
              <Image
                src={post.heroImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
          </div>
        ) : (
          // 히어로 이미지가 없을 경우 플레이스홀더
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            📄
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* 태그 칩 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tagColor(tag)}`}
              >
                # {tag}
              </span>
            ))}
          </div>
        )}

        {/* 카테고리 / subcategory 태그 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{post.section}</span>
          <span>·</span>
          <span>{post.category}</span>
          <span>·</span>
          <span className="font-medium text-primary">{post.subcategory}</span>
        </div>

        {/* 타이틀 */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* 설명 */}
        {post.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {post.description}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          {post.author && <span>{post.author}</span>}
          <span className="ml-auto">{post.date}</span>
        </div>
      </div>
    </Link>
  );
}
