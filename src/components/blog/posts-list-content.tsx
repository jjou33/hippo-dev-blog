"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/types/blog";
import { PostCard } from "@/components/blog/post-card";

const POSTS_PER_PAGE = 9;

interface PostsListContentProps {
  posts: BlogPost[];
}

export function PostsListContent({ posts }: PostsListContentProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // 검색 필터링
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.section.toLowerCase().includes(q),
    );
  }, [posts, query]);

  // 검색어 변경 시 첫 페이지로 이동
  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  // 페이지네이션 번호 목록 (최대 5개 표시)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <main className="flex-1 min-w-0 px-6 py-8 lg:px-10">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          전체 포스트
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          총 {posts.length}개의 포스트
        </p>
      </div>

      {/* 검색 바 */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="제목, 카테고리, 내용으로 검색..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
      </div>

      {/* 검색 결과 수 */}
      {query && (
        <p className="mb-4 text-sm text-muted-foreground">
          &quot;{query}&quot; 검색 결과: {filtered.length}개
        </p>
      )}

      {/* 포스트 그리드 */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Search className="mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">검색 결과가 없습니다.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-1.5">
          {/* 이전 */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* 첫 페이지 + 생략 */}
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => setPage(1)}
                className="flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-2 text-sm text-muted-foreground transition hover:bg-muted"
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className="px-1 text-muted-foreground text-sm">…</span>
              )}
            </>
          )}

          {/* 페이지 번호 */}
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition ${
                n === currentPage
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}

          {/* 생략 + 마지막 페이지 */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-1 text-muted-foreground text-sm">…</span>
              )}
              <button
                onClick={() => setPage(totalPages)}
                className="flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-2 text-sm text-muted-foreground transition hover:bg-muted"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* 다음 */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}
