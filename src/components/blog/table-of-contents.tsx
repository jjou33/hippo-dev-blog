"use client";

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
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-6 pl-4 xl:block">
      <div className="space-y-6">
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
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI 도구
          </p>
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
              마크다운으로 복사
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              ChatGPT에 질문
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Claude에 질문
            </Button>
          </div>
        </div>

        {/* Table of Contents */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            이 페이지의 내용
          </p>
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block py-1 text-sm transition-colors",
                  item.level === 1
                    ? "text-foreground"
                    : "pl-3 text-muted-foreground",
                  activeId === item.href.slice(1)
                    ? "text-foreground font-medium"
                    : "hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
