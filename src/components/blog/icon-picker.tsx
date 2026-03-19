"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  BookOpen,
  Map,
  Layers,
  Library,
  FileCode,
  Zap,
  HardDrive,
  ShieldCheck,
  Globe,
  Server,
  Database,
  Terminal,
  Cpu,
  GitBranch,
  Package,
  Wrench,
  LayoutDashboard,
  Rocket,
  Check,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export const ICON_MAP: Record<string, LucideIcon> = {
  Code2,
  BookOpen,
  Map,
  Layers,
  Library,
  FileCode,
  Zap,
  HardDrive,
  ShieldCheck,
  Globe,
  Server,
  Database,
  Terminal,
  Cpu,
  GitBranch,
  Package,
  Wrench,
  LayoutDashboard,
  Rocket,
};

export const ICON_COLOR_MAP: Record<string, string> = {
  Code2: "text-blue-500",
  BookOpen: "text-indigo-500",
  Map: "text-emerald-500",
  Layers: "text-cyan-500",
  Library: "text-amber-500",
  FileCode: "text-sky-500",
  Zap: "text-yellow-500",
  HardDrive: "text-slate-500",
  ShieldCheck: "text-green-500",
  Globe: "text-blue-400",
  Server: "text-gray-500",
  Database: "text-teal-500",
  Terminal: "text-green-600",
  Cpu: "text-purple-500",
  GitBranch: "text-orange-500",
  Package: "text-amber-600",
  Wrench: "text-gray-400",
  LayoutDashboard: "text-violet-500",
  Rocket: "text-rose-500",
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

// public/icons/ 의 커스텀 SVG 아이콘 목록을 가져오는 훅
export function useCustomIcons() {
  const [customIcons, setCustomIcons] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/custom-icons")
      .then((res) => res.json())
      .then((data) => setCustomIcons(data.icons ?? []))
      .catch(() => {});
  }, []);

  return customIcons;
}

// 아이콘 이름이 커스텀 SVG인지 확인 (예: "custom:hippo")
export function isCustomIcon(name: string) {
  return name.startsWith("custom:");
}

// 커스텀 아이콘의 public 경로 반환
export function customIconSrc(name: string) {
  return `/icons/${name.replace("custom:", "")}.svg`;
}

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IconPicker({
  value,
  onChange,
  placeholder = "아이콘 선택...",
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const customIcons = useCustomIcons();

  const isCustom = value ? isCustomIcon(value) : false;
  const SelectedIcon = !isCustom && value ? ICON_MAP[value] : null;
  const selectedColor = !isCustom && value ? ICON_COLOR_MAP[value] : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2">
            {isCustom && value ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={customIconSrc(value)} alt={value} className="h-4 w-4 shrink-0" />
                <span>{value.replace("custom:", "")}</span>
              </>
            ) : SelectedIcon ? (
              <>
                <SelectedIcon className={cn("h-4 w-4 shrink-0", selectedColor)} />
                <span>{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="아이콘 검색..." />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            {/* 기본 Lucide 아이콘 목록 */}
            <CommandGroup heading="기본 아이콘">
              {ICON_OPTIONS.map((iconName) => {
                const Icon = ICON_MAP[iconName];
                const iconColor = ICON_COLOR_MAP[iconName];
                return (
                  <CommandItem
                    key={iconName}
                    value={iconName}
                    onSelect={(selected) => {
                      onChange(selected === value ? "" : selected);
                      setOpen(false);
                    }}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", iconColor)} />
                    <span>{iconName}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === iconName ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* 커스텀 SVG 아이콘 목록 (public/icons/ 에서 로드) */}
            {customIcons.length > 0 && (
              <CommandGroup heading="커스텀 아이콘">
                {customIcons.map((iconName) => {
                  const customKey = `custom:${iconName}`;
                  return (
                    <CommandItem
                      key={customKey}
                      value={customKey}
                      onSelect={(selected) => {
                        onChange(selected === value ? "" : selected);
                        setOpen(false);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/icons/${iconName}.svg`}
                        alt={iconName}
                        className="h-4 w-4 shrink-0"
                      />
                      <span>{iconName}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === customKey ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
