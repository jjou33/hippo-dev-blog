"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/blog/header";
import { IconPicker } from "@/components/blog/icon-picker";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export type DraftPost = {
  id: string;
  title: string;
  slug: string;
  description: string;
  section: string;
  sectionIcon: string;
  category: string;
  categoryIcon: string;
  content: string;
  date: string;
  author: string;
  savedAt: string;
};

export default function AdminWritePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("");
  const [sectionIcon, setSectionIcon] = useState("");
  const [category, setCategory] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [content, setContent] = useState("# 새 포스트\n\n내용을 작성하세요...");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 발행 다이얼로그에서 수정 버튼 클릭 시: localStorage의 blog_draft_editing 키로 draft 로드
  useEffect(() => {
    const editingSlug = localStorage.getItem("blog_draft_editing");
    if (!editingSlug) return;

    const raw = localStorage.getItem("blog_drafts");
    if (!raw) return;

    const drafts: DraftPost[] = JSON.parse(raw);
    const draft = drafts.find((d) => d.id === editingSlug);
    if (!draft) return;

    setTitle(draft.title);
    setSlug(draft.slug);
    setDescription(draft.description);
    setSection(draft.section);
    setSectionIcon(draft.sectionIcon);
    setCategory(draft.category);
    setCategoryIcon(draft.categoryIcon);
    setContent(draft.content);

    localStorage.removeItem("blog_draft_editing");
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    router.replace("/");
    return null;
  }

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = () => {
    if (!title || !slug || !content) {
      setMessage({ type: "error", text: "제목, 슬러그, 내용은 필수입니다." });
      return;
    }

    const draft: DraftPost = {
      id: slug,
      title,
      slug,
      description,
      section,
      sectionIcon,
      category,
      categoryIcon,
      content,
      date: new Date().toISOString().split("T")[0],
      author: session.user.name ?? "admin",
      savedAt: new Date().toISOString(),
    };

    // 기존 drafts 읽기
    const raw = localStorage.getItem("blog_drafts");
    const drafts: DraftPost[] = raw ? JSON.parse(raw) : [];

    // slug 기준 upsert (같은 slug면 덮어쓰기)
    const idx = drafts.findIndex((d) => d.id === draft.id);
    if (idx >= 0) {
      drafts[idx] = draft;
    } else {
      drafts.push(draft);
    }

    localStorage.setItem("blog_drafts", JSON.stringify(drafts));

    // 헤더 발행 배지 즉시 갱신을 위한 커스텀 이벤트 발행
    window.dispatchEvent(new Event("drafts-updated"));

    // 저장 완료 후 홈으로 이동
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto w-[90%] px-4 lg:px-6 py-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">새 포스트 작성</h1>
          </div>

          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            임시 저장
          </Button>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Metadata fields */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">제목 *</label>
            <Input
              placeholder="포스트 제목"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">슬러그 *</label>
            <Input
              placeholder="url-friendly-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">대분류 (Section)</label>
            <Input
              placeholder="예: Frontend, DevOps, 시작하기"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">대분류 아이콘</label>
            <IconPicker
              value={sectionIcon}
              onChange={setSectionIcon}
              placeholder="대분류 아이콘 선택..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 (Category)</label>
            <Input
              placeholder="예: Next.js, Docker, 소개"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 아이콘</label>
            <IconPicker
              value={categoryIcon}
              onChange={setCategoryIcon}
              placeholder="카테고리 아이콘 선택..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">설명</label>
            <Input
              placeholder="포스트에 대한 간단한 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* MD Editor */}
        <div data-color-mode="light">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val ?? "")}
            height={600}
            preview="live"
          />
        </div>
      </div>
    </div>
  );
}
