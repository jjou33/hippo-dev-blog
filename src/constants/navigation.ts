/**
 * 헤더 네비게이션 설정
 *
 * 이 파일 하나에서 모든 헤더 라우팅을 관리합니다.
 * - 단순 링크:     { label, href }
 * - 외부 링크:     { label, href, external: true }  → 새 탭으로 열림, 아이콘 표시
 * - 드롭다운:      { label, items: [...] }
 * - 드롭다운 외부: items 안에도 external: true 사용 가능
 */

export interface NavSubItem {
  label: string;
  href: string;
  /** true 이면 새 탭으로 열리고 외부 링크 아이콘이 표시됩니다 */
  external?: boolean;
}

export interface NavItem {
  label: string;
  href?: string;
  /** true 이면 새 탭으로 열리고 외부 링크 아이콘이 표시됩니다 */
  external?: boolean;
  items?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "GITHUB", href: "https://github.com/jjou33", external: true },
  {
    label: "이전 블로그",
    items: [
      {
        label: "v2 ",
        href: "https://next-hippo-blog.vercel.app/",
        external: true,
      },
    ],
  },
  // {
  //   label: "가이드",
  //   items: [
  //     { label: "웹 앱", href: "/guides/web" },
  //     { label: "모바일 앱", href: "/guides/mobile" },
  //     { label: "서버리스", href: "/guides/serverless" },
  //   ],
  // },
  // { label: "레퍼런스", href: "/reference" },
  // {
  //   label: "리소스",
  //   items: [
  //     { label: "블로그", href: "/blog" },
  //     { label: "커뮤니티", href: "/community" },
  //     { label: "변경 로그", href: "/changelog" },
  //   ],
  // },
];
