"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  SiTypescript,
  SiJavascript,
  SiNextdotjs,
  SiReact,
  SiVuedotjs,
  SiPython,
  SiFastapi,
  SiNodedotjs,
  SiOpenai,
  SiHuggingface,
  SiPytorch,
  SiTailwindcss,
  SiLangchain,
  SiLanggraph,
} from "react-icons/si";

// ── 기술 스택 데이터 ─────────────────────────────────────────────────
// 카테고리 또는 개별 스킬 추가 시 이 배열만 수정하면 됩니다.

interface Skill {
  name: string;
  Icon: IconType;
  color: string;
}

interface SkillCategory {
  label: string;
  labelColor: string;
  skills: Skill[];
}

const SKILL_SETS: SkillCategory[] = [
  {
    label: "Frontend",
    labelColor: "#61DAFB",
    skills: [
      { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
      { name: "JavaScript", Icon: SiJavascript, color: "#F7DF1E" },
      { name: "Next.js", Icon: SiNextdotjs, color: "#ffffff" },
      { name: "React", Icon: SiReact, color: "#61DAFB" },
      { name: "Vue", Icon: SiVuedotjs, color: "#42B883" },
      { name: "Tailwind", Icon: SiTailwindcss, color: "#38BDF8" },
    ],
  },
  {
    label: "Server",
    labelColor: "#42B883",
    skills: [
      { name: "Python", Icon: SiPython, color: "#3776AB" },
      { name: "FastAPI", Icon: SiFastapi, color: "#009688" },
      { name: "Node.js", Icon: SiNodedotjs, color: "#339933" },
    ],
  },
  {
    label: "AI",
    labelColor: "#F5A623",
    skills: [
      { name: "LangChain", Icon: SiLangchain, color: "#ffffff" },
      { name: "LangGraph", Icon: SiLanggraph, color: "#FFD21E" },
    ],
  },
];

// ── 터미널 라인 정의 ─────────────────────────────────────────────────

interface TerminalLine {
  type: "command" | "output" | "skillset" | "blank";
  text: string;
}

const lines: TerminalLine[] = [
  { type: "command", text: "whoami" },
  { type: "output", text: "Hippo — Front & Ai Developer" },
  { type: "blank", text: "" },
  { type: "command", text: "cat about.txt" },
  { type: "output", text: "개발 경험과 인사이트를 기록하는 공간입니다." },
  { type: "output", text: "현재 관심사: AI 통합, 시스템 설계" },
  { type: "blank", text: "" },
  { type: "command", text: "cat skillset.txt" },
  { type: "skillset", text: "" },
  { type: "blank", text: "" },
  { type: "command", text: "ls posts/ | wc -l" },
];

// ── 컴포넌트 ─────────────────────────────────────────────────────────

export function TerminalIntro({ postCount }: { postCount: number }) {
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
          <div
            key={i}
            className={
              line.type === "skillset" ? "pl-4 space-y-1.5 my-1" : "flex"
            }
          >
            {line.type === "command" && (
              <>
                <span className="text-emerald-400 select-none mr-2">$</span>
                <span className="text-white">{line.text}</span>
              </>
            )}
            {line.type === "output" && (
              <span className="text-zinc-300 pl-4">{line.text}</span>
            )}
            {line.type === "skillset" &&
              SKILL_SETS.map((category) => (
                <div
                  key={category.label}
                  className="flex items-center gap-3 flex-wrap"
                >
                  {/* 카테고리 레이블 */}
                  <span
                    className="w-20 shrink-0 text-xs font-bold"
                    style={{ color: category.labelColor }}
                  >
                    [{category.label}]
                  </span>
                  {/* 스킬 목록 */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {category.skills.map(({ name, Icon, color }) => (
                      <span
                        key={name}
                        className="flex items-center gap-1 text-zinc-300"
                      >
                        <Icon
                          style={{ color }}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span className="text-xs">{name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {line.type === "blank" && <span>&nbsp;</span>}
          </div>
        ))}

        {/* 포스트 수 출력 */}
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
