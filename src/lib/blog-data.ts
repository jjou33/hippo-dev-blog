import type { NavSection, TableOfContentsItem, BlogPost } from "@/types/blog";

export const logo = {
  src: "/logo.png",
  alt: "logo",
  width: 120,
  height: 32,
  href: "/",
};
export const navigationData: NavSection[] = [
  {
    title: "시작하기",
    icon: "Code2",
    items: [
      { title: "소개", href: "/docs/introduction" },
      { title: "빠른 시작", href: "/docs/quickstart" },
      { title: "설치 가이드", href: "/docs/installation" },
    ],
  },
  {
    title: "핵심 개념",
    items: [
      { title: "아키텍처", href: "/docs/architecture" },
      {
        title: "데이터 모델링",
        href: "/docs/data-modeling",
        items: [
          { title: "스키마 설계", href: "/docs/data-modeling/schema" },
          {
            title: "관계 설정",
            href: "/docs/data-modeling/relations",
            isActive: true,
          },
          { title: "마이그레이션", href: "/docs/data-modeling/migrations" },
        ],
      },
      { title: "인증 & 권한", href: "/docs/auth" },
    ],
  },
  {
    title: "가이드",
    items: [
      { title: "API 연동", href: "/docs/guides/api" },
      { title: "실시간 기능", href: "/docs/guides/realtime" },
      { title: "파일 스토리지", href: "/docs/guides/storage" },
      { title: "엣지 함수", href: "/docs/guides/edge-functions" },
    ],
  },
  {
    title: "고급 주제",
    items: [
      { title: "성능 최적화", href: "/docs/advanced/performance" },
      { title: "보안 설정", href: "/docs/advanced/security" },
      { title: "모니터링", href: "/docs/advanced/monitoring" },
      { title: "백업 & 복구", href: "/docs/advanced/backup" },
    ],
  },
  {
    title: "레퍼런스",
    items: [
      { title: "CLI 명령어", href: "/docs/reference/cli" },
      { title: "SDK 문서", href: "/docs/reference/sdk" },
      { title: "API 레퍼런스", href: "/docs/reference/api" },
    ],
  },
];

export const tableOfContentsData: TableOfContentsItem[] = [
  { title: "시작하기 전에", href: "#before-you-begin", level: 1 },
  { title: "필수 요구사항", href: "#requirements", level: 2 },
  { title: "환경 설정", href: "#environment-setup", level: 2 },
  { title: "관계 설정 방법", href: "#how-to-setup", level: 1 },
  { title: "일대일 관계", href: "#one-to-one", level: 2 },
  { title: "일대다 관계", href: "#one-to-many", level: 2 },
  { title: "다대다 관계", href: "#many-to-many", level: 2 },
  { title: "주의사항", href: "#things-to-keep-in-mind", level: 1 },
  { title: "자주 묻는 질문", href: "#faq", level: 1 },
];

export const sampleBlogPost: BlogPost = {
  slug: "data-modeling-relations",
  title: "관계 설정",
  description:
    "데이터베이스에서 테이블 간의 관계를 효과적으로 설정하는 방법을 알아봅니다.",
  section: "핵심 개념",
  category: "데이터 모델링",
  date: "2024-03-12",
  author: "개발팀",
  content: `
데이터베이스 관계 설정은 효율적인 데이터 구조를 만드는 핵심입니다. 
이 가이드에서는 다양한 관계 유형과 구현 방법을 다룹니다.
  `,
};
