"use client";

import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "시작", href: "/docs" },
  {
    label: "제품",
    items: [
      { label: "데이터베이스", href: "/products/database" },
      { label: "인증", href: "/products/auth" },
      { label: "스토리지", href: "/products/storage" },
    ],
  },
  {
    label: "가이드",
    items: [
      { label: "웹 앱", href: "/guides/web" },
      { label: "모바일 앱", href: "/guides/mobile" },
      { label: "서버리스", href: "/guides/serverless" },
    ],
  },
  { label: "레퍼런스", href: "/reference" },
  {
    label: "리소스",
    items: [
      { label: "블로그", href: "/blog" },
      { label: "커뮤니티", href: "/community" },
      { label: "변경 로그", href: "/changelog" },
    ],
  },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
            <span className="text-xs font-bold text-background">D</span>
          </div>
          <span className="hidden font-semibold sm:inline-block">DOCS</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) =>
            item.items ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {item.items.map((subItem) => (
                    <DropdownMenuItem key={subItem.label} asChild>
                      <Link href={subItem.href}>{subItem.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            )
          )}
        </nav>

        {/* Search & Actions */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="문서 검색..."
              className="h-9 w-64 bg-muted/50 pl-9 text-sm"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          <Button variant="outline" size="sm" className="hidden sm:flex">
            대시보드
          </Button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}
