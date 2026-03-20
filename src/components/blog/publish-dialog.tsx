"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { ICON_MAP, ICON_COLOR_MAP } from "@/components/blog/icon-picker";
import type { DraftPost } from "@/app/admin/write/page";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: DraftPost[];
  onPublished: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  drafts,
  onPublished,
}: PublishDialogProps) {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);

  // 다이얼로그 열릴 때마다 전체 선택 초기화
  useEffect(() => {
    if (open) {
      setCheckedIds(new Set(drafts.map((d) => d.id)));
    }
  }, [open, drafts]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === drafts.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(drafts.map((d) => d.id)));
    }
  };

  const handleDelete = (id: string) => {
    const raw = localStorage.getItem("blog_drafts");
    const allDrafts: DraftPost[] = raw ? JSON.parse(raw) : [];
    const remaining = allDrafts.filter((d) => d.id !== id);

    if (remaining.length === 0) {
      localStorage.removeItem("blog_drafts");
    } else {
      localStorage.setItem("blog_drafts", JSON.stringify(remaining));
    }

    // 체크 상태에서도 제거
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    window.dispatchEvent(new Event("drafts-updated"));
  };

  const handleEdit = (draft: DraftPost) => {
    // 수정할 draft id를 localStorage에 저장 후 write 페이지로 이동
    localStorage.setItem("blog_draft_editing", draft.id);
    onOpenChange(false);
    router.push("/admin/write");
  };

  const handlePublish = async () => {
    const selectedDrafts = drafts.filter((d) => checkedIds.has(d.id));
    if (selectedDrafts.length === 0) return;

    setIsPublishing(true);

    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts: selectedDrafts }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "발행에 실패했습니다.");

      // 발행된 draft들만 localStorage에서 제거
      const raw = localStorage.getItem("blog_drafts");
      const allDrafts: DraftPost[] = raw ? JSON.parse(raw) : [];
      const remaining = allDrafts.filter((d) => !checkedIds.has(d.id));

      if (remaining.length === 0) {
        localStorage.removeItem("blog_drafts");
      } else {
        localStorage.setItem("blog_drafts", JSON.stringify(remaining));
      }

      window.dispatchEvent(new Event("drafts-updated"));
      onPublished();
      onOpenChange(false);

      alert(`${data.published}개 포스트가 발행되었습니다. 잠시 후 자동 배포됩니다.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "발행에 실패했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedCount = checkedIds.size;
  const allChecked = drafts.length > 0 && checkedIds.size === drafts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>발행할 포스트 선택</DialogTitle>
        </DialogHeader>

        {/* 전체 선택 */}
        {drafts.length > 1 && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              checked={allChecked}
              onCheckedChange={toggleAll}
              id="check-all"
            />
            <label htmlFor="check-all" className="text-sm text-muted-foreground cursor-pointer">
              전체 선택 ({drafts.length}개)
            </label>
          </div>
        )}

        {/* Draft 목록 */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {drafts.map((draft) => {
            const SectionIcon = draft.sectionIcon ? ICON_MAP[draft.sectionIcon] : null;
            const CategoryIcon = draft.categoryIcon ? ICON_MAP[draft.categoryIcon] : null;
            const sectionIconColor = draft.sectionIcon ? ICON_COLOR_MAP[draft.sectionIcon] : undefined;
            const categoryIconColor = draft.categoryIcon ? ICON_COLOR_MAP[draft.categoryIcon] : undefined;

            return (
              <div
                key={draft.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  checked={checkedIds.has(draft.id)}
                  onCheckedChange={() => toggleCheck(draft.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{draft.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {draft.section && (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs px-2 py-0.5 h-5 bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100"
                      >
                        {SectionIcon && <SectionIcon className={`h-3 w-3 shrink-0 ${sectionIconColor ?? ""}`} />}
                        {draft.section}
                      </Badge>
                    )}
                    {draft.category && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs px-2 py-0.5 h-5 bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {CategoryIcon && <CategoryIcon className={`h-3 w-3 shrink-0 ${categoryIconColor ?? ""}`} />}
                        {draft.category}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* 수정 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(draft)}
                  title="수정하기"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(draft.id)}
                  title="삭제하기"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || selectedCount === 0}
            className="gap-2"
          >
            {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
            선택 발행 ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
