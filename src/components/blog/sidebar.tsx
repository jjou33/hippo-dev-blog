"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Mail,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { NavSection, NavItem } from "@/types/blog";
import {
  ICON_MAP as iconMap,
  ICON_COLOR_MAP as iconColorMap,
  isCustomIcon,
  customIconSrc,
} from "@/components/blog/icon-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── 프로필 설정 ──────────────────────────────────────────────────────

const PROFILE = {
  name: "Hippo",
  title: "Front & AI Developer",
  description: "개발 경험과 인사이트를\n기록하는 공간입니다.",
  avatar: "/profile.png" as string | null,
  github: "https://github.com/jjou33",
  email: "zanda33@naver.com",
};

interface VisitorStats {
  today: number;
  total: number;
}

interface SidebarProps {
  sections: NavSection[];
  postCount?: number;
  visitorStats?: VisitorStats;
}

function NavItemComponent({
  item,
  level = 0,
  currentPath,
}: {
  item: NavItem;
  level?: number;
  currentPath: string;
}) {
  const isActive = item.href ? item.href === currentPath : false;
  const [isOpen, setIsOpen] = useState(
    item.items?.some(
      (i) => i.href === currentPath || i.items?.some((s) => s.href === currentPath),
    ) ?? false,
  );
  const hasChildren = item.items && item.items.length > 0;
  const Icon =
    item.icon && !isCustomIcon(item.icon) ? iconMap[item.icon] : null;
  const customSrc =
    item.icon && isCustomIcon(item.icon) ? customIconSrc(item.icon) : null;

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between py-1.5 text-sm transition-colors",
            level === 0
              ? "text-foreground hover:text-foreground"
              : "text-muted-foreground hover:text-foreground",
            isActive && "text-primary font-medium",
          )}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          <span className="flex items-center gap-2">
            {customSrc ? (
              <img src={customSrc} alt="" className="h-4 w-4 shrink-0" />
            ) : (
              Icon && <Icon className={cn("h-4 w-4 shrink-0", item.icon ? iconColorMap[item.icon] : "")} />
            )}
            {item.title}
          </span>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      ) : (
        <Link
          href={item.href || "#"}
          className={cn(
            "flex items-center justify-between gap-2 py-1.5 text-sm transition-colors",
            level === 0
              ? "text-foreground hover:text-foreground"
              : "text-muted-foreground hover:text-foreground",
            isActive && "text-emerald-600 font-medium",
          )}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          <span className="flex items-center gap-2 min-w-0">
            {customSrc ? (
              <img src={customSrc} alt="" className="h-4 w-4 shrink-0" />
            ) : (
              Icon && <Icon className={cn("h-4 w-4 shrink-0", item.icon ? iconColorMap[item.icon] : "")} />
            )}
            <span className="truncate">{item.title}</span>
          </span>
          {/* subcategory 포스트 수 badge */}
          {item.count !== undefined && (
            <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.count}
            </span>
          )}
        </Link>
      )}

      {/* 부드러운 펼침/접힘 애니메이션 (CSS grid trick) */}
      {hasChildren && (
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-1">
              {item.items!.map((child) => (
                <NavItemComponent
                  key={child.title}
                  item={child}
                  level={level + 1}
                  currentPath={currentPath}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function Sidebar({ sections, postCount, visitorStats }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });
  const pathname = usePathname();

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const expandSidebar = () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "false");
    setIsCollapsed(false);
  };

  return (
    <TooltipProvider delayDuration={200}>
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-border lg:block transition-all duration-300",
        isCollapsed ? "w-[60px]" : "w-64 overflow-y-auto",
      )}
    >
      {/* 사이드바 토글 버튼 */}
      <button
        onClick={toggleCollapsed}
        className={cn(
          "absolute z-10 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          isCollapsed ? "right-2 top-3" : "right-2 top-3",
        )}
        title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      {/* 펼쳐진 사이드바 */}
      {!isCollapsed && (
        <>
          {/* 프로필 영역 */}
          <div className="flex flex-col gap-4 border-b border-border px-4 py-5">
            {/* 아바타 + 이름/직함 */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
                {PROFILE.avatar ? (
                  <Image src={PROFILE.avatar} alt={PROFILE.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-emerald-400 to-cyan-500 text-xl font-bold text-white select-none">
                    {PROFILE.name[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{PROFILE.name}</p>
                <p className="text-xs text-emerald-500">{PROFILE.title}</p>
              </div>
            </div>

            {/* 소개글 */}
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {PROFILE.description}
            </p>

            {/* 포스트 수 */}
            {postCount !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{postCount}</span>
                <span>posts</span>
              </div>
            )}

            {/* 소셜 링크 */}
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={PROFILE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <SiGithub className="h-4 w-4" />
                    GitHub
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom">{PROFILE.github}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom">{PROFILE.email}</TooltipContent>
              </Tooltip>
            </div>

            {/* 방문자 통계 */}
            {visitorStats && (
              <div className="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  <span>오늘</span>
                  <span className="font-semibold text-foreground">{visitorStats.today.toLocaleString()}</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>전체</span>
                  <span className="font-semibold text-foreground">{visitorStats.total.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-6 py-6 pr-4 pl-4">
            {sections.map((section) => {
              const SectionIcon =
                section.icon && !isCustomIcon(section.icon)
                  ? iconMap[section.icon]
                  : null;
              const sectionCustomSrc =
                section.icon && isCustomIcon(section.icon)
                  ? customIconSrc(section.icon)
                  : null;
              return (
                <div key={section.title}>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-1 ring-border shrink-0">
                      {sectionCustomSrc ? (
                        <img
                          src={sectionCustomSrc}
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                      ) : (
                        SectionIcon && <SectionIcon className={cn("h-3 w-3", section.icon ? iconColorMap[section.icon] : "")} />
                      )}
                    </span>
                    {section.title}
                  </h4>
                  <div className="space-y-0.5 ml-3">
                    {section.items.map((item) => (
                      <NavItemComponent key={item.title} item={item} currentPath={pathname} />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </>
      )}

      {/* 접힌 독(Dock) 메뉴 */}
      {isCollapsed && (
          <div className="flex flex-col items-center gap-2 py-4 pt-12">
            {/* 프로필 아바타 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={expandSidebar}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full overflow-hidden ring-2 ring-border mb-1 transition-all duration-200 hover:scale-110 hover:ring-emerald-400"
                >
                  {PROFILE.avatar ? (
                    <Image src={PROFILE.avatar} alt={PROFILE.name} width={40} height={40} className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white select-none">
                      {PROFILE.name[0]}
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{PROFILE.name} · {PROFILE.title}</TooltipContent>
            </Tooltip>

            {sections.map((section) => {
              const SectionIcon =
                section.icon && !isCustomIcon(section.icon)
                  ? iconMap[section.icon]
                  : null;
              const sectionCustomSrc =
                section.icon && isCustomIcon(section.icon)
                  ? customIconSrc(section.icon)
                  : null;

              return (
                <Tooltip key={section.title}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={expandSidebar}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-muted transition-all duration-200 hover:scale-125 hover:bg-accent hover:shadow-md"
                    >
                      {sectionCustomSrc ? (
                        <img
                          src={sectionCustomSrc}
                          alt={section.title}
                          className="h-5 w-5"
                        />
                      ) : SectionIcon ? (
                        <SectionIcon className={cn("h-5 w-5 transition-colors", section.icon ? iconColorMap[section.icon] : "text-muted-foreground")} />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          {section.title[0]}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {section.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
      )}
    </aside>
    </TooltipProvider>
  );
}
