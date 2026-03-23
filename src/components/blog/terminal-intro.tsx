"use client";

import { useEffect, useState } from "react";

interface TerminalLine {
  type: "command" | "output" | "blank";
  text: string;
}

const lines: TerminalLine[] = [
  { type: "command", text: "whoami" },
  { type: "output", text: "Hippo — Backend Developer" },
  { type: "blank", text: "" },
  { type: "command", text: "cat about.txt" },
  { type: "output", text: "개발 경험과 인사이트를 기록하는 공간입니다." },
  { type: "output", text: "TypeScript · Java · Next.js · Spring" },
  { type: "output", text: "현재 관심사: AI 통합, 시스템 설계" },
  { type: "blank", text: "" },
  { type: "command", text: "ls posts/ | wc -l" },
];

export function TerminalIntro({ postCount }: { postCount: number }) {
  // 한 줄씩 순차적으로 타이핑 효과
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= lines.length) return;

    const delay = lines[visibleCount].type === "blank" ? 150 : 300;
    const timer = setTimeout(() => setVisibleCount((v) => v + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  const allVisible = visibleCount >= lines.length;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border shadow-lg font-mono text-sm">
      {/* 터미널 상단 바 */}
      <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-zinc-400">hippo@dev-blog ~ %</span>
      </div>

      {/* 터미널 본문 */}
      <div className="bg-zinc-900 px-5 py-5 text-zinc-100 leading-relaxed min-h-[220px]">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className="flex">
            {line.type === "command" && (
              <>
                <span className="text-emerald-400 select-none mr-2">$</span>
                <span className="text-white">{line.text}</span>
              </>
            )}
            {line.type === "output" && (
              <span className="text-zinc-300 pl-4">{line.text}</span>
            )}
            {line.type === "blank" && <span>&nbsp;</span>}
          </div>
        ))}

        {/* 마지막 줄 — 포스트 수 출력 */}
        {allVisible && (
          <div className="flex">
            <span className="text-zinc-300 pl-4">
              {postCount} posts and counting...
            </span>
          </div>
        )}

        {/* 커서 */}
        <div className="flex mt-1">
          <span className="text-emerald-400 select-none mr-2">$</span>
          <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
