import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/types/blog";

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
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          // 히어로 이미지가 없을 경우 플레이스홀더
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            📄
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col gap-2 p-4">
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
