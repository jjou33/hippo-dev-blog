"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection, NavItem } from "@/types/blog";
import {
  ICON_MAP as iconMap,
  isCustomIcon,
  customIconSrc,
} from "@/components/blog/icon-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VisitorStats {
  today: number;
  total: number;
}

interface SidebarProps {
  sections: NavSection[];
  logo?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    href?: string;
  };
  visitorStats?: VisitorStats;
}

const TYPING_TEXT = "HIPPO DOCS";

function TypingTitle() {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (displayed.length < TYPING_TEXT.length) {
      const timer = setTimeout(
        () => setDisplayed(TYPING_TEXT.slice(0, displayed.length + 1)),
        110,
      );
      return () => clearTimeout(timer);
    }
  }, [displayed]);

  // 타이핑 완료 후 커서 깜빡임
  useEffect(() => {
    const interval = setInterval(
      () => setCursorVisible((v) => !v),
      530,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-sm font-bold tracking-[0.2em] text-foreground select-none">
      {displayed}
      <span className={cn("ml-0.5 inline-block w-[2px] h-[1.1em] align-middle bg-foreground transition-opacity", cursorVisible ? "opacity-100" : "opacity-0")} />
    </span>
  );
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
              Icon && <Icon className="h-4 w-4 shrink-0" />
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
              Icon && <Icon className="h-4 w-4 shrink-0" />
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

export function Sidebar({ sections, logo, visitorStats }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

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
        onClick={() => setIsCollapsed(!isCollapsed)}
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
          {/* 로고 영역 */}
          {logo && (
            <div className="flex flex-col items-center gap-5 border-b border-border px-4 py-5">
              {/* 원형 심볼 로고 */}
              <div
                className="rounded-2xl"
                style={{
                  boxShadow:
                    "0 4px 16px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.10)",
                }}
              >
                {logo.href ? (
                  <Link href={logo.href}>
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.width ?? 128}
                      height={logo.height ?? 128}
                      className="rounded-2xl object-cover"
                    />
                  </Link>
                ) : (
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width ?? 72}
                    height={logo.height ?? 72}
                    className="rounded-2xl object-cover"
                  />
                )}
              </div>

              {/* 타이핑 타이틀 */}
              <TypingTitle />

              {/* 소셜 링크 */}
              <div className="flex items-center justify-center gap-5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://github.com/jjou33"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-all duration-200 hover:scale-125 hover:drop-shadow-md"
                    >
                      <Image src="/icons/github.svg" alt="GitHub" width={20} height={20} />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">GitHub</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="mailto:zanda33@naver.com"
                      className="transition-all duration-200 hover:scale-125 hover:drop-shadow-md"
                    >
                      <Image src="/icons/email.svg" alt="Email" width={20} height={20} />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">zanda33@naver.com</TooltipContent>
                </Tooltip>
              </div>

              {/* 방문자 통계 */}
              {visitorStats && (
                <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>오늘</span>
                    <span className="font-semibold text-foreground">
                      {visitorStats.today.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-border" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>전체</span>
                    <span className="font-semibold text-foreground">
                      {visitorStats.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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
                        SectionIcon && <SectionIcon className="h-3 w-3" />
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
                      onClick={() => setIsCollapsed(false)}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-muted transition-all duration-200 hover:scale-125 hover:bg-accent hover:shadow-md"
                    >
                      {sectionCustomSrc ? (
                        <img
                          src={sectionCustomSrc}
                          alt={section.title}
                          className="h-5 w-5"
                        />
                      ) : SectionIcon ? (
                        <SectionIcon className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
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
