"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubcategoryUploadButtonProps {
  subcategory: string;
  hasCoverImage: boolean;
}

export function SubcategoryUploadButton({
  subcategory,
  hasCoverImage,
}: SubcategoryUploadButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  const [preview, setPreview] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string>("");
  const [previewExt, setPreviewExt] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      setPreviewBase64(base64);
      setPreviewExt(ext);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewBase64 || !previewExt) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/upload-subcategory-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategory, base64: previewBase64, ext: previewExt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      setOpen(false);
      setPreview(null);
      setPreviewBase64("");
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    setPreviewBase64("");
    setPreviewExt("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-xs">
          <ImagePlus className="h-3 w-3" />
          커버 {hasCoverImage ? "변경" : "추가"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>커버 이미지 업로드</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="미리보기" className="h-48 w-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={handleRemovePreview}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">클릭하거나 이미지를 드래그하세요</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!previewBase64 || isUploading}
              className="gap-1.5"
            >
              {isUploading ? (
                "업로드 중..."
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  업로드
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
