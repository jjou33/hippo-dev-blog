import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/types/blog";

// 태그별 색상 (순환 배치)
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

interface HorizontalPostCardProps {
  post: BlogPost;
}

export function HorizontalPostCard({ post }: HorizontalPostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      {/* 왼쪽 이미지 영역 */}
      <div className="relative w-28 shrink-0 overflow-hidden bg-muted sm:w-36">
        {post.heroImage ? (
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 112px, 144px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            📄
          </div>
        )}
      </div>

      {/* 오른쪽 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
        {/* 태그 칩 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag)}`}
              >
                # {tag}
              </span>
            ))}
          </div>
        )}

        {/* 제목 */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* 설명 */}
        {post.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {post.description}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          {post.author && <span>{post.author}</span>}
          {post.author && <span>·</span>}
          <span>{post.date}</span>
        </div>
      </div>
    </Link>
  );
}
