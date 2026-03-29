import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, NavSection, NavItem } from "@/types/blog";

const postsDirectory = path.join(process.cwd(), "content/posts");

// tags 필드 파싱 (배열, 쉼표 구분 문자열 모두 지원)
function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

// subcategory 폴더 이름 탐색 (폴더명이 subcategory와 다를 경우 frontmatter로 검색)
export function findSubcategoryFolder(subcategory: string): string | null {
  if (!fs.existsSync(postsDirectory)) return null;
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });
  // 1차: 폴더명이 subcategory와 일치
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name === subcategory) return entry.name;
  }
  // 2차: 폴더 내 포스트의 frontmatter subcategory로 검색
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const subcatDir = path.join(postsDirectory, entry.name);
    const slugEntries = fs.readdirSync(subcatDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      const indexPath = path.join(subcatDir, slugEntry.name, "index.md");
      if (!fs.existsSync(indexPath)) continue;
      const { data } = matter(fs.readFileSync(indexPath, "utf8"));
      if (data.subcategory === subcategory) return entry.name;
    }
  }
  return null;
}

// subcategory 커버 이미지 경로 반환 (없으면 null)
export function getSubcategoryCoverImage(subcategory: string): string | null {
  const folder = findSubcategoryFolder(subcategory);
  if (!folder) return null;
  const exts = ["png", "jpg", "jpeg", "gif", "webp"];
  for (const ext of exts) {
    const coverPath = path.join(postsDirectory, folder, `cover.${ext}`);
    if (fs.existsSync(coverPath)) {
      return `/api/content-image?path=${encodeURIComponent(`${folder}/cover.${ext}`)}`;
    }
  }
  return null;
}

// 상대 경로 heroImage를 /api/content-image?path=... 형태로 변환
function resolveHeroImage(heroImage: string | undefined, filePath: string): string | undefined {
  if (!heroImage) return undefined;
  // 이미 절대 URL이면 그대로 반환
  if (heroImage.startsWith("http://") || heroImage.startsWith("https://") || heroImage.startsWith("/")) {
    return heroImage;
  }
  // 상대 경로: 파일 디렉토리 기준으로 절대 경로 계산 후 API 경로로 변환
  const dir = path.dirname(filePath);
  const absolutePath = path.resolve(dir, heroImage);
  const relativePath = path.relative(postsDirectory, absolutePath);
  return `/api/content-image?path=${encodeURIComponent(relativePath)}`;
}

// frontmatter + content → BlogPost 변환 헬퍼
function parsePostFile(filePath: string, slug: string): BlogPost {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    section: data.section ?? "기타",
    sectionIcon: data.sectionIcon,
    category: data.category ?? "기타",
    categoryIcon: data.categoryIcon,
    subcategory: data.subcategory ?? "일반",
    subcategoryIcon: data.subcategoryIcon,
    date: data.date ?? "",
    author: data.author ?? "",
    heroImage: resolveHeroImage(data.heroImage, filePath),
    heroImageFit: data.heroImageFit === "contain" ? "contain" : "cover",
    featured: data.featured ?? false,
    tags: parseTags(data.tags),
    adminOnly: data.adminOnly ?? false,
    content,
  } satisfies BlogPost;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const results: BlogPost[] = [];
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      // 이전 플랫 구조: content/posts/{slug}.md
      const slug = entry.name.replace(/\.md$/, "");
      results.push(parsePostFile(path.join(postsDirectory, entry.name), slug));
    } else if (entry.isDirectory()) {
      // 새 중첩 구조: content/posts/{subcategory}/{slug}/index.md
      const subcatDir = path.join(postsDirectory, entry.name);
      const slugEntries = fs.readdirSync(subcatDir, { withFileTypes: true });
      for (const slugEntry of slugEntries) {
        if (slugEntry.isDirectory()) {
          const indexPath = path.join(subcatDir, slugEntry.name, "index.md");
          if (fs.existsSync(indexPath)) {
            results.push(parsePostFile(indexPath, slugEntry.name));
          }
        }
      }
    }
  }

  return results.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  // 이전 플랫 구조 확인
  const flatPath = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(flatPath)) {
    return parsePostFile(flatPath, slug);
  }

  // 새 중첩 구조: content/posts/{subcategory}/{slug}/index.md 탐색
  if (!fs.existsSync(postsDirectory)) return null;
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const indexPath = path.join(postsDirectory, entry.name, slug, "index.md");
      if (fs.existsSync(indexPath)) {
        return parsePostFile(indexPath, slug);
      }
    }
  }

  return null;
}

// section > category > subcategory > posts 4단계 계층 구조로 네비게이션 데이터 생성
export function getNavigationFromPosts(currentSlug?: string, postsInput?: BlogPost[]): NavSection[] {
  const posts = postsInput ?? getAllPosts();

  type SubcategoryData = { icon?: string; posts: BlogPost[] };
  type CategoryData = { icon?: string; subcategories: Map<string, SubcategoryData> };
  type SectionData = { icon?: string; categories: Map<string, CategoryData> };

  const sectionMap = new Map<string, SectionData>();

  for (const post of posts) {
    if (!sectionMap.has(post.section)) {
      sectionMap.set(post.section, { icon: post.sectionIcon, categories: new Map() });
    }
    const section = sectionMap.get(post.section)!;

    if (!section.categories.has(post.category)) {
      section.categories.set(post.category, { icon: post.categoryIcon, subcategories: new Map() });
    }
    const category = section.categories.get(post.category)!;

    if (!category.subcategories.has(post.subcategory)) {
      category.subcategories.set(post.subcategory, { icon: post.subcategoryIcon, posts: [] });
    }
    category.subcategories.get(post.subcategory)!.posts.push(post);
  }

  const navSections: NavSection[] = [];

  for (const [sectionTitle, sectionData] of sectionMap) {
    const categoryItems: NavItem[] = [];

    for (const [categoryTitle, categoryData] of sectionData.categories) {
      const subcategoryItems: NavItem[] = [];

      for (const [subcategoryTitle, subcategoryData] of categoryData.subcategories) {
        const href = `/blog/subcategory/${encodeURIComponent(sectionTitle)}/${encodeURIComponent(categoryTitle)}/${encodeURIComponent(subcategoryTitle)}`;
        const isActive = subcategoryData.posts.some((p) => p.slug === currentSlug);

        subcategoryItems.push({
          title: subcategoryTitle,
          href,
          isActive,
          icon: subcategoryData.icon,
          count: subcategoryData.posts.length,
        });
      }

      categoryItems.push({
        title: categoryTitle,
        icon: categoryData.icon,
        items: subcategoryItems,
      });
    }

    navSections.push({
      title: sectionTitle,
      icon: sectionData.icon,
      items: categoryItems,
    });
  }

  return navSections;
}

// subcategory 리스트 페이지용: section + category + subcategory로 포스트 필터링
export function getPostsBySubcategory(
  section: string,
  category: string,
  subcategory: string,
): BlogPost[] {
  return getAllPosts().filter(
    (p) => p.section === section && p.category === category && p.subcategory === subcategory,
  );
}
