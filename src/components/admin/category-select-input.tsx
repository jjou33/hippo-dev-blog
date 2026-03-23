"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface CategorySelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

const NEW_VALUE = "__new__";

export function CategorySelectInput({
  value,
  onChange,
  options,
  placeholder = "선택...",
  disabled = false,
}: CategorySelectInputProps) {
  // 현재 값이 옵션에 없으면 직접 입력 모드
  const [isCustom, setIsCustom] = useState(() => !!value && !options.includes(value));

  useEffect(() => {
    if (value && !options.includes(value)) setIsCustom(true);
  }, [value, options]);

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          autoFocus
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="기존 목록으로 돌아가기"
          onClick={() => { onChange(""); setIsCustom(false); }}
          disabled={disabled}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value || ""}
      disabled={disabled}
      onValueChange={(v) => {
        if (v === NEW_VALUE) {
          onChange("");
          setIsCustom(true);
        } else {
          onChange(v);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
        <SelectItem value={NEW_VALUE} className="text-primary font-medium">
          + 직접 입력
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
