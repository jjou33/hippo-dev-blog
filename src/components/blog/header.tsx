"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  LogIn,
  LogOut,
  Shield,
  User,
  PenSquare,
  Send,
  Sun,
  MoonStar,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PublishDialog } from "@/components/blog/publish-dialog";
import {
  ICON_MAP,
  isCustomIcon,
  customIconSrc,
} from "@/components/blog/icon-picker";
import type { DraftPost } from "@/app/admin/write/page";
import type { BlogPost } from "@/types/blog";

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

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => signIn("google")}
        title="Google로 로그인"
      >
        <LogIn className="h-4 w-4" />
      </Button>
    );
  }

  const { user } = session;
  const isAdmin = user.role === "admin";
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground leading-none">
              {user.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {isAdmin ? (
                <Shield className="h-3 w-3 text-primary" />
              ) : (
                <User className="h-3 w-3 text-muted-foreground" />
              )}
              <span
                className={`text-xs font-medium ${isAdmin ? "text-primary" : "text-muted-foreground"}`}
              >
                {isAdmin ? "관리자" : "방문자"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface HeaderProps {
  posts?: BlogPost[];
}

// 검색용 포스트 타입 (content 제외)
type SearchPost = Omit<BlogPost, "content" | "date" | "author" | "heroImage" | "heroImageFit" | "featured" | "tags">;

export function Header({ posts: propPosts }: HeaderProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const router = useRouter();

  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  // 전체 포스트 (검색용) — prop이 없으면 API에서 자동 fetch
  const [allPosts, setAllPosts] = useState<SearchPost[]>(propPosts ?? []);
  useEffect(() => {
    if (propPosts && propPosts.length > 0) return; // prop으로 받은 경우 재요청 불필요
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllPosts(data);
      })
      .catch(() => {}); // 조용히 실패 — 검색 기능만 비활성화됨
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 검색어로 포스트 필터링
  const filteredPosts = searchQuery.trim()
    ? allPosts.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // 검색어 변경 시 선택 인덱스 리셋
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // cmd+k / ctrl+k 로 검색 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 검색창 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPost = (post: SearchPost) => {
    router.push(`/blog/${post.slug}`);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const syncDrafts = () => {
    const raw = localStorage.getItem("blog_drafts");
    setDrafts(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    syncDrafts();

    // 다른 탭에서 localStorage 변경 시 대응
    window.addEventListener("storage", syncDrafts);
    // 같은 탭에서 저장 시 대응 (write 페이지에서 커스텀 이벤트 발행)
    window.addEventListener("drafts-updated", syncDrafts);

    return () => {
      window.removeEventListener("storage", syncDrafts);
      window.removeEventListener("drafts-updated", syncDrafts);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Image
              src="/icon.svg"
              alt="hippo docs"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="hidden font-semibold sm:inline-block">
              HIPPO DOCS
            </span>
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
              ),
            )}

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-sm text-primary hover:text-primary/80"
                asChild
              >
                <Link href="/admin/write">
                  <PenSquare className="h-3.5 w-3.5" />
                  컨텐츠 생성
                </Link>
              </Button>
            )}

            {/* 임시 저장된 draft가 있을 때만 표시되는 발행 버튼 */}
            {isAdmin && drafts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="relative gap-1 text-sm text-orange-600 hover:text-orange-500"
                onClick={() => setPublishDialogOpen(true)}
              >
                <Send className="h-3.5 w-3.5" />
                발행
                {/* draft 개수 배지 */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {drafts.length}
                </span>
              </Button>
            )}
          </nav>

          {/* Search & Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* 검색창 */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="문서 검색..."
                className="h-9 w-64 bg-muted/50 pl-9 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsSearchOpen(false);
                    setSelectedIndex(-1);
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                      prev < filteredPosts.length - 1 ? prev + 1 : prev,
                    );
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  }
                  if (e.key === "Enter" && filteredPosts.length > 0) {
                    handleSelectPost(
                      filteredPosts[selectedIndex >= 0 ? selectedIndex : 0],
                    );
                  }
                }}
              />
              {!searchQuery && (
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}

              {/* 검색 결과 드롭다운 */}
              {isSearchOpen && filteredPosts.length > 0 && (
                <div className="absolute top-full left-0 z-50 mt-1 w-96 max-h-80 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                  {filteredPosts.map((post, index) => {
                    const SectionIcon =
                      post.sectionIcon && !isCustomIcon(post.sectionIcon)
                        ? ICON_MAP[post.sectionIcon]
                        : null;
                    const CategoryIcon =
                      post.categoryIcon && !isCustomIcon(post.categoryIcon)
                        ? ICON_MAP[post.categoryIcon]
                        : null;
                    return (
                      <button
                        key={post.slug}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                          index === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/60"
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => handleSelectPost(post)}
                      >
                        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-wrap items-center gap-1 text-xs">
                          {post.sectionIcon &&
                          isCustomIcon(post.sectionIcon) ? (
                            <img
                              src={customIconSrc(post.sectionIcon)}
                              alt=""
                              className="h-3 w-3 shrink-0 opacity-60"
                            />
                          ) : (
                            SectionIcon && (
                              <SectionIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )
                          )}
                          <span className="text-muted-foreground">
                            {post.section}
                          </span>
                          <span className="text-muted-foreground/40">›</span>
                          {post.categoryIcon &&
                          isCustomIcon(post.categoryIcon) ? (
                            <img
                              src={customIconSrc(post.categoryIcon)}
                              alt=""
                              className="h-3 w-3 shrink-0 opacity-60"
                            />
                          ) : (
                            CategoryIcon && (
                              <CategoryIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )
                          )}
                          <span className="text-muted-foreground">
                            {post.category}
                          </span>
                          <span className="text-muted-foreground/40">›</span>
                          <span className="font-medium text-foreground">
                            {post.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 검색어가 있지만 결과 없음 */}
              {isSearchOpen &&
                searchQuery.trim() &&
                filteredPosts.length === 0 && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-96 rounded-md border border-border bg-popover px-4 py-3 shadow-lg">
                    <p className="text-sm text-muted-foreground">
                      &ldquo;{searchQuery}&rdquo; 에 대한 결과가 없습니다.
                    </p>
                  </div>
                )}
            </div>

            <Button variant="outline" size="sm" className="hidden sm:flex">
              대시보드
            </Button>

            {/* 다크모드 토글 스위치 */}
            {!mounted ? (
              <div className="h-7 w-14" />
            ) : (
              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                title="테마 전환"
                className={`relative flex h-7 w-14 items-center rounded-full border px-1 transition-colors duration-300 ${
                  resolvedTheme === "dark"
                    ? "border-indigo-600 bg-indigo-950"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <span
                  className={`absolute flex h-5 w-5 items-center justify-center rounded-full shadow transition-all duration-300 ${
                    resolvedTheme === "dark"
                      ? "translate-x-7 bg-indigo-500"
                      : "translate-x-0 bg-amber-400"
                  }`}
                >
                  {resolvedTheme === "dark" ? (
                    <MoonStar className="h-3 w-3 text-white" />
                  ) : (
                    <Sun className="h-3 w-3 text-white" />
                  )}
                </span>
              </button>
            )}

            <UserMenu />
          </div>
        </div>
      </header>

      {/* 발행 다이얼로그 */}
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        drafts={drafts}
        onPublished={syncDrafts}
      />
    </>
  );
}
