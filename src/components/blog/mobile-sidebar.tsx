"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { NavSection, NavItem } from "@/types/blog";

interface MobileSidebarProps {
  sections: NavSection[];
}

function MobileNavItem({ item, level = 0 }: { item: NavItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.items && item.items.length > 0;

  return (
    <div>
      {hasChildren ? (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex w-full items-center justify-between py-2 text-sm",
              item.isActive ? "text-emerald-600 font-medium" : "text-foreground"
            )}
            style={{ paddingLeft: `${level * 12}px` }}
          >
            {item.title}
          </button>
          {isOpen && (
            <div>
              {item.items!.map((child) => (
                <MobileNavItem key={child.title} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.href || "#"}
          className={cn(
            "block py-2 text-sm",
            item.isActive
              ? "text-emerald-600 font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          {item.title}
        </Link>
      )}
    </div>
  );
}

export function MobileSidebar({ sections }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

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
      <SheetContent side="left" className="w-72 overflow-y-auto">
        <SheetTitle className="mb-4">문서 탐색</SheetTitle>
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h4>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <MobileNavItem key={item.title} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
