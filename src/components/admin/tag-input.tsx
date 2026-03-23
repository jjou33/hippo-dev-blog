"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full hover:text-primary/70 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder={value.length === 0 ? "태그 입력 후 Enter 또는 쉼표로 추가" : ""}
        className="min-w-[140px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
