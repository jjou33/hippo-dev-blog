"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Copy, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TableOfContentsItem } from "@/types/blog";

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  activeId?: string;
}

export function TableOfContents({ items, activeId }: TableOfContentsProps) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  // 활성 항목이 바뀌면 TOC 스크롤 영역 내에서 해당 항목이 보이도록 스크롤
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeId]);

  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-60 shrink-0 py-6 pr-4 xl:block">
      <div className="flex max-h-[calc(100vh-8rem)] flex-col rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="toc-scroll space-y-5 overflow-y-auto overscroll-contain">
          {/* Feedback Section */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              도움이 되었나요?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="sr-only">도움이 안됨</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="sr-only">도움됨</span>
              </Button>
            </div>
          </div>

          {/* AI Tools Section */}
          <div className="border-t border-border/40 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI 도구
            </p>
            <div className="space-y-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
                마크다운으로 복사
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                ChatGPT에 질문
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-4 w-4" />
                Claude에 질문
              </Button>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="border-t border-border/40 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              이 페이지의 내용
            </p>
            <nav className="space-y-0.5">
              {items.map((item) => {
                const isActive = activeId === item.href.slice(1);
                return (
                  <Link
                    key={item.href}
                    ref={isActive ? activeRef : null}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-[13px] leading-snug transition-all",
                      item.level === 1 ? "" : "pl-4",
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
