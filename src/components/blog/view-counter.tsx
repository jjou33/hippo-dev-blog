"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  slug: string;
}

// 글별 조회수를 Supabase에 기록하고 표시하는 컴포넌트
export function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // 개발환경에서는 조회수 증가 없이 조회만
    const method = process.env.NODE_ENV === "production" ? "POST" : "GET";

    fetch(`/api/post-stats/${encodeURIComponent(slug)}`, { method })
      .then((res) => res.json())
      .then((data) => setViews(data.views))
      .catch(() => {});
  }, [slug]);

  if (views === null) return null;

  return (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <Eye className="h-3.5 w-3.5" />
      {views.toLocaleString()}
    </span>
  );
}
