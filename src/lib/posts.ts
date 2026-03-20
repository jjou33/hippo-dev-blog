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
        date: data.date ?? "",
        author: data.author ?? "",
        heroImage: data.heroImage,
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
    date: data.date ?? "",
    author: data.author ?? "",
    heroImage: data.heroImage,
    content,
  };
}

export function getNavigationFromPosts(currentSlug?: string): NavSection[] {
  const posts = getAllPosts();

  // section → { icon, categories: Map<string, { icon, posts }> }
  const sectionMap = new Map<
    string,
    {
      icon?: string;
      categories: Map<string, { icon?: string; posts: BlogPost[] }>;
    }
  >();

  for (const post of posts) {
    if (!sectionMap.has(post.section)) {
      sectionMap.set(post.section, {
        icon: post.sectionIcon,
        categories: new Map(),
      });
    }
    const section = sectionMap.get(post.section)!;

    if (!section.categories.has(post.category)) {
      section.categories.set(post.category, {
        icon: post.categoryIcon,
        posts: [],
      });
    }
    section.categories.get(post.category)!.posts.push(post);
  }

  const navSections: NavSection[] = [];

  for (const [sectionTitle, sectionData] of sectionMap) {
    const categoryItems: NavItem[] = [];

    for (const [categoryTitle, categoryData] of sectionData.categories) {
      const postItems: NavItem[] = categoryData.posts.map((post) => ({
        title: post.title,
        href: `/blog/${post.slug}`,
        isActive: post.slug === currentSlug,
      }));

      categoryItems.push({
        title: categoryTitle,
        icon: categoryData.icon,
        items: postItems,
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
