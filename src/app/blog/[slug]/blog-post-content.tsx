"use client";

import dynamic from "next/dynamic";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
);

export function BlogPostContent({ content }: { content: string }) {
  return (
    <div data-color-mode="auto" className="prose-container">
      <MarkdownPreview
        source={content}
        style={{ background: "transparent" }}
      />
    </div>
  );
}
