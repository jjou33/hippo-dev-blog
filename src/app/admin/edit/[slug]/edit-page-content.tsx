"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/blog/header";
import { IconPicker } from "@/components/blog/icon-picker";
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
  const [content, setContent] = useState(post.content);
  const [heroImageBase64, setHeroImageBase64] = useState("");
  const [heroImageExt, setHeroImageExt] = useState("");
  const [existingHeroImage] = useState(post.heroImage ?? "");
  const [removeHeroImage, setRemoveHeroImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      content,
      date: post.date || new Date().toISOString().split("T")[0],
      author: post.author || session?.user?.name || "admin",
      savedAt: new Date().toISOString(),
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

        {/* 히어로 이미지 */}
        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium">히어로 이미지 (선택)</label>
          {displayImage ? (
            <div className="relative w-full overflow-hidden rounded-lg border">
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
            </div>
          ) : (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">클릭하여 이미지 업로드</span>
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
