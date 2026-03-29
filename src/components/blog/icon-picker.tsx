"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FcProcess,
  FcDocument,
  FcDatabase,
  FcSettings,
  FcFolder,
  FcGlobe,
  FcMindMap,
  FcFlowChart,
  FcEngineering,
  FcIdea,
  FcRules,
  FcTemplate,
  FcKey,
  FcPackage,
  FcTreeStructure,
  FcReading,
  FcElectronics,
  FcBinoculars,
  FcMultipleDevices,
  FcDeployment,
  FcCommandLine,
  FcWorkflow,
  FcPieChart,
  FcBullish,
  FcSurvey,
  FcOrganization,
  FcConferenceCall,
  FcAutomatic,
  FcAbout,
  FcGoodDecision,
  // 확장 아이콘
  FcAcceptDatabase,
  FcAndroidOs,
  FcApproval,
  FcAreaChart,
  FcAssistant,
  FcBarChart,
  FcBriefcase,
  FcBusiness,
  FcCalendar,
  FcCheckmark,
  FcCollaboration,
  FcComments,
  FcDataBackup,
  FcDataConfiguration,
  FcDataEncryption,
  FcDataProtection,
  FcDecision,
  FcDepartment,
  FcDisplay,
  FcFilm,
  FcGallery,
  FcGenealogy,
  FcGraduationCap,
  FcHeadset,
  FcHighPriority,
  FcHome,
  FcInfo,
  FcInspection,
  FcLibrary,
  FcLineChart,
  FcLinux,
  FcList,
  FcLock,
  FcManager,
  FcMoneyTransfer,
  FcNews,
  FcOnlineSupport,
  FcParallelTasks,
  FcPhone,
  FcPicture,
  FcPlanner,
  FcPositiveDynamic,
  FcPrint,
  FcPrivacy,
  FcPuzzle,
  FcQuestions,
  FcSearch,
  FcSerialTasks,
  FcServices,
  FcSmartphoneTablet,
  FcStackOfPhotos,
  FcStart,
  FcStatistics,
  FcTimeline,
  FcTodoList,
  FcUnlock,
  FcUpload,
  FcVideoCall,
  FcVideoFile,
  FcViewDetails,
  FcCurrencyExchange,
  FcNumericalSorting12,
  FcDataSheet,
  FcCircuit,
  FcCapacitor,
  FcElectroDevices,
  FcWiFiLogo,
} from "react-icons/fc";
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

export const ICON_MAP: Record<string, IconType> = {
  // 기존 키 유지 (저장된 포스트 호환)
  Code2: FcProcess,
  BookOpen: FcReading,
  Map: FcGlobe,
  Layers: FcMindMap,
  Library: FcRules,
  FileCode: FcDocument,
  Zap: FcIdea,
  HardDrive: FcElectronics,
  ShieldCheck: FcKey,
  Globe: FcGlobe,
  Server: FcDeployment,
  Database: FcDatabase,
  Terminal: FcCommandLine,
  Cpu: FcEngineering,
  GitBranch: FcTreeStructure,
  Package: FcPackage,
  Wrench: FcSettings,
  LayoutDashboard: FcTemplate,
  Rocket: FcFlowChart,
  // 추가 fc 아이콘
  Folder: FcFolder,
  Binoculars: FcBinoculars,
  MultipleDevices: FcMultipleDevices,
  Workflow: FcWorkflow,
  PieChart: FcPieChart,
  Bullish: FcBullish,
  Survey: FcSurvey,
  Organization: FcOrganization,
  ConferenceCall: FcConferenceCall,
  Automatic: FcAutomatic,
  About: FcAbout,
  GoodDecision: FcGoodDecision,
  // 확장 아이콘
  AcceptDatabase: FcAcceptDatabase,
  AndroidOs: FcAndroidOs,
  Approval: FcApproval,
  AreaChart: FcAreaChart,
  Assistant: FcAssistant,
  BarChart: FcBarChart,
  Briefcase: FcBriefcase,
  Business: FcBusiness,
  Calendar: FcCalendar,
  Checkmark: FcCheckmark,
  Collaboration: FcCollaboration,
  Comments: FcComments,
  DataBackup: FcDataBackup,
  DataConfiguration: FcDataConfiguration,
  DataEncryption: FcDataEncryption,
  DataProtection: FcDataProtection,
  Decision: FcDecision,
  Department: FcDepartment,
  Display: FcDisplay,
  Film: FcFilm,
  Gallery: FcGallery,
  Genealogy: FcGenealogy,
  GraduationCap: FcGraduationCap,
  Headset: FcHeadset,
  HighPriority: FcHighPriority,
  Home: FcHome,
  Info: FcInfo,
  Inspection: FcInspection,
  LineChart: FcLineChart,
  Linux: FcLinux,
  List: FcList,
  Lock: FcLock,
  Manager: FcManager,
  MoneyTransfer: FcMoneyTransfer,
  News: FcNews,
  OnlineSupport: FcOnlineSupport,
  ParallelTasks: FcParallelTasks,
  Phone: FcPhone,
  Picture: FcPicture,
  Planner: FcPlanner,
  PositiveDynamic: FcPositiveDynamic,
  Print: FcPrint,
  Privacy: FcPrivacy,
  Puzzle: FcPuzzle,
  Questions: FcQuestions,
  Search: FcSearch,
  SerialTasks: FcSerialTasks,
  Services: FcServices,
  SmartphoneTablet: FcSmartphoneTablet,
  StackOfPhotos: FcStackOfPhotos,
  Start: FcStart,
  Statistics: FcStatistics,
  Timeline: FcTimeline,
  TodoList: FcTodoList,
  Unlock: FcUnlock,
  Upload: FcUpload,
  VideoCall: FcVideoCall,
  VideoFile: FcVideoFile,
  ViewDetails: FcViewDetails,
  CurrencyExchange: FcCurrencyExchange,
  NumericalSorting: FcNumericalSorting12,
  DataSheet: FcDataSheet,
  Circuit: FcCircuit,
  Capacitor: FcCapacitor,
  ElectroDevices: FcElectroDevices,
  WiFiLogo: FcWiFiLogo,
};

// fc 아이콘은 자체 색상을 가지므로 색상 맵 불필요 (하위 호환용 빈 객체 유지)
export const ICON_COLOR_MAP: Record<string, string> = {};

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
                <img
                  src={customIconSrc(value)}
                  alt={value}
                  className="h-4 w-4 shrink-0"
                />
                <span>{value.replace("custom:", "")}</span>
              </>
            ) : SelectedIcon ? (
              <>
                <SelectedIcon className="h-4 w-4 shrink-0" />
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
            {/* 기본 fc 아이콘 목록 */}
            <CommandGroup heading="기본 아이콘">
              {ICON_OPTIONS.map((iconName) => {
                const Icon = ICON_MAP[iconName];
                return (
                  <CommandItem
                    key={iconName}
                    value={iconName}
                    onSelect={(selected) => {
                      onChange(selected === value ? "" : selected);
                      setOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
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
