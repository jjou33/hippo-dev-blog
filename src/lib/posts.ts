import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, NavSection, NavItem } from "@/types/blog";

const postsDirectory = path.join(process.cwd(), "content/posts");

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const files = fs.readdirSync(postsDirectory);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const filePath = path.join(postsDirectory, file);
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
        heroImage: data.heroImage,
        featured: data.featured ?? false,
        content,
      } satisfies BlogPost;
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

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
    heroImage: data.heroImage,
    featured: data.featured ?? false,
    content,
  };
}

// section > category > subcategory > posts 4단계 계층 구조로 네비게이션 데이터 생성
export function getNavigationFromPosts(currentSlug?: string): NavSection[] {
  const posts = getAllPosts();

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
