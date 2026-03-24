import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts";

export async function GET() {
  const posts = getAllPosts();
  // 검색에 필요한 필드만 반환 (content 제외로 응답 크기 최소화)
  const searchPosts = posts.map(({ slug, title, description, section, sectionIcon, category, categoryIcon, subcategory }) => ({
    slug,
    title,
    description,
    section,
    sectionIcon,
    category,
    categoryIcon,
    subcategory,
  }));
  return NextResponse.json(searchPosts);
}
