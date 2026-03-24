"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { NavSection, NavItem } from "@/types/blog";
import {
  ICON_MAP as iconMap,
  isCustomIcon,
  customIconSrc,
} from "@/components/blog/icon-picker";

interface MobileSidebarProps {
  sections: NavSection[];
}

function MobileNavItem({
  item,
  level = 0,
  currentPath,
  onNavigate,
}: {
  item: NavItem;
  level?: number;
  currentPath: string;
  onNavigate: () => void;
}) {
  const isActive = item.href ? item.href === currentPath : false;
  const [isOpen, setIsOpen] = useState(
    item.items?.some(
      (i) => i.href === currentPath || i.items?.some((s) => s.href === currentPath),
    ) ?? false,
  );
  const hasChildren = item.items && item.items.length > 0;

  const Icon = item.icon && !isCustomIcon(item.icon) ? iconMap[item.icon] : null;
  const customSrc = item.icon && isCustomIcon(item.icon) ? customIconSrc(item.icon) : null;

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between py-2 text-sm transition-colors",
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
          onClick={onNavigate}
          className={cn(
            "flex items-center justify-between gap-2 py-2 text-sm transition-colors",
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
          {item.count !== undefined && (
            <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.count}
            </span>
          )}
        </Link>
      )}

      {/* 부드러운 펼침/접힘 애니메이션 */}
      {hasChildren && (
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-0.5">
              {item.items!.map((child) => (
                <MobileNavItem
                  key={child.title}
                  item={child}
                  level={level + 1}
                  currentPath={currentPath}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileSidebar({ sections }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-foreground text-background hover:bg-foreground/90"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto px-5">
        <SheetTitle className="mb-4">문서 탐색</SheetTitle>
        <nav className="space-y-6">
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
                      <img src={sectionCustomSrc} alt="" className="h-3.5 w-3.5" />
                    ) : (
                      SectionIcon && <SectionIcon className="h-3 w-3" />
                    )}
                  </span>
                  {section.title}
                </h4>
                <div className="space-y-0.5 ml-3">
                  {section.items.map((item) => (
                    <MobileNavItem
                      key={item.title}
                      item={item}
                      currentPath={pathname}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
