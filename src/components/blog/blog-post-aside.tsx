"use client";

import { useEffect, useState } from "react";
import { TableOfContents } from "./table-of-contents";
import type { TableOfContentsItem } from "@/types/blog";

interface BlogPostAsideProps {
  items: TableOfContentsItem[];
}

export function BlogPostAside({ items }: BlogPostAsideProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    // 헤딩 ID 목록 추출
    const ids = items.map((item) => item.href.slice(1));

    const observer = new IntersectionObserver(
      (entries) => {
        // 화면에 보이는 헤딩 중 가장 위에 있는 것을 활성으로 설정
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    // DOM이 렌더링된 후 헤딩 요소 관찰 시작
    const timer = setTimeout(() => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [items]);

  if (items.length === 0) return null;

  return <TableOfContents items={items} activeId={activeId} />;
}
