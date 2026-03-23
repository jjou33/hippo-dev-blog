import { auth } from "@/auth";
import { getAllPosts } from "@/lib/posts";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const posts = getAllPosts();
  const sections = [...new Set(posts.map((p) => p.section).filter(Boolean))];

  // section → categories 매핑
  const sectionCategoryMap: Record<string, string[]> = {};
  for (const post of posts) {
    if (!post.section || !post.category) continue;
    if (!sectionCategoryMap[post.section]) sectionCategoryMap[post.section] = [];
    if (!sectionCategoryMap[post.section].includes(post.category)) {
      sectionCategoryMap[post.section].push(post.category);
    }
  }

  // category → subcategories 매핑
  const categorySubcategoryMap: Record<string, string[]> = {};
  for (const post of posts) {
    if (!post.category || !post.subcategory) continue;
    if (!categorySubcategoryMap[post.category]) categorySubcategoryMap[post.category] = [];
    if (!categorySubcategoryMap[post.category].includes(post.subcategory)) {
      categorySubcategoryMap[post.category].push(post.subcategory);
    }
  }

  return NextResponse.json({ sections, sectionCategoryMap, categorySubcategoryMap });
}
