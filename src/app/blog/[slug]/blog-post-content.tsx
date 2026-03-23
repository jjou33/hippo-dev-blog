"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
);

export function BlogPostContent({ content }: { content: string }) {
  // OS 기반이 아닌 블로그의 .dark 클래스 기준으로 색상 모드 감지
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateColorMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setColorMode(isDark ? "dark" : "light");
    };

    updateColorMode();

    // .dark 클래스 변경 감지
    const observer = new MutationObserver(updateColorMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div data-color-mode={colorMode} className="prose-container">
      <MarkdownPreview
        source={content}
        style={{ background: "transparent" }}
      />
    </div>
  );
}
