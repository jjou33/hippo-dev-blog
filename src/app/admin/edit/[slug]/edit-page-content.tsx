"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/blog/header";
import { IconPicker } from "@/components/blog/icon-picker";
import { CategorySelectInput } from "@/components/admin/category-select-input";
import { TagInput } from "@/components/admin/tag-input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Send, Loader2, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface EditPageContentProps {
  post: BlogPost;
}

export function EditPageContent({ post }: EditPageContentProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState(post.title);
  const [slug] = useState(post.slug); // 슬러그는 파일명이므로 변경 불가
  const [description, setDescription] = useState(post.description);
  const [section, setSection] = useState(post.section);
  const [sectionIcon, setSectionIcon] = useState(post.sectionIcon ?? "");
  const [category, setCategory] = useState(post.category);
  const [categoryIcon, setCategoryIcon] = useState(post.categoryIcon ?? "");
  const [subcategory, setSubcategory] = useState(post.subcategory ?? "");
  const [subcategoryIcon, setSubcategoryIcon] = useState(post.subcategoryIcon ?? "");
  const [tags, setTags] = useState<string[]>(post.tags ?? []);
  const [content, setContent] = useState(post.content);
  const [adminOnly, setAdminOnly] = useState(post.adminOnly ?? false);
  const [featured, setFeatured] = useState(post.featured ?? false);
  const [heroImageBase64, setHeroImageBase64] = useState("");
  const [heroImageExt, setHeroImageExt] = useState("");
  const [existingHeroImage] = useState(post.heroImage ?? "");
  const [removeHeroImage, setRemoveHeroImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [isHeroDragging, setIsHeroDragging] = useState(false);
  const heroDragCounterRef = useRef(0);

  // 기존 분류 옵션 (매핑 포함)
  const [sections, setSections] = useState<string[]>([]);
  const [sectionCategoryMap, setSectionCategoryMap] = useState<Record<string, string[]>>({});
  const [categorySubcategoryMap, setCategorySubcategoryMap] = useState<Record<string, string[]>>({});

  // 선택된 section/category에 따른 필터링된 옵션
  const filteredCategories = section ? (sectionCategoryMap[section] ?? []) : [];
  const filteredSubcategories = category ? (categorySubcategoryMap[category] ?? []) : [];

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        setSections(d.sections ?? []);
        setSectionCategoryMap(d.sectionCategoryMap ?? {});
        setCategorySubcategoryMap(d.categorySubcategoryMap ?? {});
      })
      .catch(() => {});
  }, []);

  // 이미지 파일 → GitHub 업로드 → URL 반환
  const uploadImageFile = useCallback(
    async (file: File): Promise<string | null> => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, ext, subcategory, slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error ?? "이미지 업로드에 실패했습니다." });
        return null;
      }
      const { url } = await res.json();
      return url as string;
    },
    [slug, subcategory, setMessage]
  );

  // 커서(또는 선택) 위치에 마크다운 삽입
  const insertAtCursor = useCallback(
    (textarea: HTMLTextAreaElement, markdown: string) => {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      setContent((prev) => prev.slice(0, start) + markdown + prev.slice(end));
    },
    []
  );

  // 클립보드 붙여넣기: 바이너리 이미지 / HTML <img> / 이미지 URL 텍스트
  const handleEditorPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const clipboard = e.clipboardData;
      if (!clipboard) return;
      const items = Array.from(clipboard.items);
      const textarea = e.target as HTMLTextAreaElement;

      // 케이스 1: 바이너리 이미지 (스크린샷, 로컬 파일)
      const binaryItem = items.find((item) => item.type.startsWith("image/"));
      if (binaryItem) {
        e.preventDefault();
        const file = binaryItem.getAsFile();
        if (!file) return;
        const url = await uploadImageFile(file);
        if (url) insertAtCursor(textarea, `![image](${url})`);
        return;
      }

      // 케이스 2: text/html — 브라우저에서 이미지 복사 시 <img src="...">
      const htmlItem = items.find((item) => item.type === "text/html");
      if (htmlItem) {
        const html = await new Promise<string>((r) => htmlItem.getAsString(r));
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match?.[1]) {
          e.preventDefault();
          insertAtCursor(textarea, `![image](${match[1]})`);
          return;
        }
      }

      // 케이스 3: text/plain — 이미지 URL 직접 붙여넣기
      const textItem = items.find((item) => item.type === "text/plain");
      if (textItem) {
        const text = await new Promise<string>((r) => textItem.getAsString(r));
        const trimmed = text.trim();
        const isImageUrl =
          /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(trimmed) ||
          /^https?:\/\/github\.com\/user-attachments\/assets\//i.test(trimmed) ||
          /^https?:\/\/[^/]*\.(githubusercontent|github)\.com\/.+/i.test(trimmed);
        if (isImageUrl) {
          e.preventDefault();
          insertAtCursor(textarea, `![image](${trimmed})`);
        }
      }
    },
    [uploadImageFile, insertAtCursor]
  );

  // 드래그 앤 드롭 (textarea 레벨 — 커서 위치에 삽입)
  const handleEditorDrop = useCallback(
    async (e: React.DragEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const textarea = e.target as HTMLTextAreaElement;
      for (const file of files) {
        const url = await uploadImageFile(file);
        if (url) insertAtCursor(textarea, `![image](${url})\n`);
      }
      setIsDragging(false);
      dragCounterRef.current = 0;
    },
    [uploadImageFile, insertAtCursor]
  );

  // 드래그 앤 드롭 (외부 div 레벨 — textarea 핸들러가 동작하지 않을 때 fallback)
  const handleContainerDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      e.preventDefault();
      for (const file of files) {
        const url = await uploadImageFile(file);
        if (url) setContent((prev) => `${prev}\n![image](${url})\n`);
      }
      setIsDragging(false);
      dragCounterRef.current = 0;
    },
    [uploadImageFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHeroImageBase64(ev.target?.result as string);
      setHeroImageExt(ext);
    };
    reader.readAsDataURL(file);
  };

  const handleHeroDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    heroDragCounterRef.current += 1;
    if (heroDragCounterRef.current === 1) setIsHeroDragging(true);
  }, []);

  const handleHeroDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    heroDragCounterRef.current -= 1;
    if (heroDragCounterRef.current === 0) setIsHeroDragging(false);
  }, []);

  const handleHeroDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeroDragging(false);
    heroDragCounterRef.current = 0;
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHeroImageBase64(ev.target?.result as string);
      setHeroImageExt(ext);
      setRemoveHeroImage(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePublish = async () => {
    if (!title || !content) {
      setMessage({ type: "error", text: "제목과 내용은 필수입니다." });
      return;
    }

    setIsPublishing(true);
    setMessage(null);

    // 히어로 이미지 처리
    // - 새 이미지가 있으면 base64 전송
    // - 기존 이미지를 유지하면 heroImage 경로 전송
    // - 이미지 제거 시 heroImage 없이 전송
    const heroFields =
      heroImageBase64 && heroImageExt
        ? { heroImageBase64, heroImageExt }
        : !removeHeroImage && existingHeroImage
          ? { heroImage: existingHeroImage }
          : {};

    const draft = {
      id: slug,
      title,
      slug,
      description,
      section,
      sectionIcon,
      category,
      categoryIcon,
      subcategory,
      subcategoryIcon,
      content,
      date: post.date || new Date().toISOString().split("T")[0],
      author: post.author || session?.user?.name || "admin",
      savedAt: new Date().toISOString(),
      adminOnly,
      featured,
      ...heroFields,
    };

    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts: [draft] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "발행에 실패했습니다.");

      setMessage({ type: "success", text: "포스트가 성공적으로 수정 발행되었습니다." });
      setTimeout(() => router.push(`/blog/${slug}`), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "발행에 실패했습니다.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 현재 표시할 이미지: 새 이미지 > 기존 이미지
  const displayImage = heroImageBase64 || (!removeHeroImage && existingHeroImage ? existingHeroImage : "");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto w-[90%] px-4 lg:px-6 py-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/blog/${slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">포스트 수정</h1>
          </div>

          <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            수정 발행
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
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">슬러그 (변경 불가)</label>
            <Input value={slug} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">대분류 (Section)</label>
            <CategorySelectInput
              value={section}
              onChange={(v) => { setSection(v); setCategory(""); setSubcategory(""); }}
              options={sections}
              placeholder="대분류 선택 또는 입력..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">대분류 아이콘</label>
            <IconPicker value={sectionIcon} onChange={setSectionIcon} placeholder="대분류 아이콘 선택..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 (Category)</label>
            <CategorySelectInput
              value={category}
              onChange={(v) => { setCategory(v); setSubcategory(""); }}
              options={filteredCategories}
              placeholder={section ? "카테고리 선택 또는 입력..." : "대분류를 먼저 선택하세요"}
              disabled={!section}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 아이콘</label>
            <IconPicker value={categoryIcon} onChange={setCategoryIcon} placeholder="카테고리 아이콘 선택..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">서브카테고리 (Subcategory)</label>
            <CategorySelectInput
              value={subcategory}
              onChange={setSubcategory}
              options={filteredSubcategories}
              placeholder={category ? "서브카테고리 선택 또는 입력..." : "카테고리를 먼저 선택하세요"}
              disabled={!category}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">서브카테고리 아이콘</label>
            <IconPicker value={subcategoryIcon} onChange={setSubcategoryIcon} placeholder="서브카테고리 아이콘 선택..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">설명</label>
            <Input
              placeholder="포스트에 대한 간단한 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">태그</label>
            <TagInput value={tags} onChange={setTags} />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Switch
                id="admin-only"
                checked={adminOnly}
                onCheckedChange={setAdminOnly}
              />
              <div>
                <label htmlFor="admin-only" className="text-sm font-medium cursor-pointer">관리자 전용</label>
                <p className="text-xs text-muted-foreground">활성화하면 일반 사용자에게 이 포스트가 표시되지 않습니다.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
              <div>
                <label htmlFor="featured" className="text-sm font-medium cursor-pointer">추천 포스트</label>
                <p className="text-xs text-muted-foreground">활성화하면 홈 히어로 캐러셀에 추천 포스트로 노출됩니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 히어로 이미지 */}
        <div
          className="mb-6 space-y-2"
          onDragEnter={handleHeroDragEnter}
          onDragLeave={handleHeroDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleHeroDrop}
        >
          <label className="text-sm font-medium">히어로 이미지 (선택)</label>
          {displayImage ? (
            <div className={`relative w-full overflow-hidden rounded-lg border transition-all ${isHeroDragging ? "ring-2 ring-primary" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="히어로 미리보기"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setHeroImageBase64("");
                  setHeroImageExt("");
                  setRemoveHeroImage(true);
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="이미지 제거"
              >
                <X className="h-4 w-4" />
              </button>
              {isHeroDragging && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/20">
                  <p className="text-sm font-medium text-primary">이미지를 놓아 교체하세요</p>
                </div>
              )}
            </div>
          ) : (
            <label className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${isHeroDragging ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">{isHeroDragging ? "여기에 놓으세요" : "클릭하거나 이미지를 드래그하세요"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeroImageChange}
              />
            </label>
          )}
        </div>

        {/* MD Editor */}
        <div
          data-color-mode="light"
          className="relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleContainerDrop}
        >
          {isDragging && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10">
              <p className="text-sm font-medium text-primary">이미지를 여기에 놓으세요</p>
            </div>
          )}
          <MDEditor
            value={content}
            onChange={(val) => setContent(val ?? "")}
            height={600}
            preview="live"
            textareaProps={{
              onPaste: handleEditorPaste,
              onDrop: handleEditorDrop,
              onDragOver: (e) => e.preventDefault(),
            }}
          />
        </div>
      </div>
    </div>
  );
}
