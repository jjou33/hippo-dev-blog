"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  BookOpen,
  Map,
  Layers,
  Library,
  FileCode,
  Zap,
  HardDrive,
  ShieldCheck,
  Eye,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection, NavItem } from "@/types/blog";

// 아이콘 문자열 → 컴포넌트 매핑 (Client Component 내부에서만 사용)
const iconMap: Record<string, LucideIcon> = {
  Code2,
  BookOpen,
  Map,
  Layers,
  Library,
  FileCode,
  Zap,
  HardDrive,
  ShieldCheck,
};

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

function NavItemComponent({
  item,
  level = 0,
}: {
  item: NavItem;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(
    item.items?.some((i) => i.isActive || i.items?.some((s) => s.isActive)) ??
      false,
  );
  const hasChildren = item.items && item.items.length > 0;
  const Icon = item.icon ? iconMap[item.icon] : null;

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
            item.isActive && "text-primary font-medium",
          )}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          <span className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
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
            "flex items-center gap-2 py-1.5 text-sm transition-colors",
            level === 0
              ? "text-foreground hover:text-foreground"
              : "text-muted-foreground hover:text-foreground",
            item.isActive && "text-emerald-600 font-medium",
          )}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {item.title}
        </Link>
      )}

      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.items!.map((child) => (
            <NavItemComponent
              key={child.title}
              item={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ sections, logo, visitorStats }: SidebarProps) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border lg:block">
      {/* 로고 영역 */}
      {logo && (
        <div className="flex flex-col items-center gap-3 border-b border-border px-4 py-5">
          {/* 원형 심볼 로고 */}
          <div
            className="rounded-full"
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
                  width={logo.width ?? 72}
                  height={logo.height ?? 72}
                  className="rounded-full object-cover"
                />
              </Link>
            ) : (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width ?? 72}
                height={logo.height ?? 72}
                className="rounded-full object-cover"
              />
            )}
          </div>

          {/* 타이틀 로고 */}

          <Image
            src="/logo-title.svg"
            alt="title logo"
            width={170}
            height={40}
            className="object-contain ml-9"
          />

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
          const SectionIcon = section.icon ? iconMap[section.icon] : null;
          return (
            <div key={section.title}>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {SectionIcon && <SectionIcon className="h-3.5 w-3.5" />}
                {section.title}
              </h4>
              <div className="space-y-0.5 ml-3">
                {section.items.map((item) => (
                  <NavItemComponent key={item.title} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
