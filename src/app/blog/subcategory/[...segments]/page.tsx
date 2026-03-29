export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPostsBySubcategory, getSubcategoryCoverImage } from "@/lib/posts";
import { auth } from "@/auth";
import { PostCard } from "@/components/blog/post-card";
import { SubcategoryCoverSection } from "@/components/blog/subcategory-cover-section";
import { SubcategoryUploadButton } from "@/components/blog/subcategory-upload-button";

interface SubcategoryPageProps {
  params: Promise<{ segments: string[] }>;
}

export async function generateMetadata({ params }: SubcategoryPageProps) {
  const { segments } = await params;
  const [section, category, subcategory] = segments.map(decodeURIComponent);

  return {
    title: `${subcategory} | ${category} — ${section}`,
    description: `${section} > ${category} > ${subcategory} 에 속한 포스트 목록`,
  };
}

export default async function SubcategoryPage({
  params,
}: SubcategoryPageProps) {
  const { segments } = await params;
  const [section, category, subcategory] = segments.map(decodeURIComponent);

  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const allPosts = getPostsBySubcategory(section, category, subcategory);
  const posts = isAdmin ? allPosts : allPosts.filter((p) => !p.adminOnly);

  if (posts.length === 0) {
    notFound();
  }

  const coverImage = getSubcategoryCoverImage(subcategory);

  return (
    <div className="flex flex-1 min-w-0">
      <main className="flex-1 min-w-0 px-6 py-8 lg:px-10">
        {/* 커버 이미지 (이미지 있을 때만 표시) */}
        <SubcategoryCoverSection
          subcategory={subcategory}
          coverImage={coverImage}
        />

        {/* 헤더 영역 */}
        <div className="mb-8">
          {/* breadcrumb */}
          <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{section}</span>
            <span>/</span>
            <span>{category}</span>
            <span>/</span>
            <span className="font-medium text-foreground">{subcategory}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {subcategory}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {posts.length}개의 포스트
            </p>
            <SubcategoryUploadButton
              subcategory={subcategory}
              hasCoverImage={!!coverImage}
            />
          </div>
        </div>

        {/* 포스트 카드 그리드 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </main>

      {/* 오른쪽 빈 여백 (기존 TOC 레이아웃과 일관성 유지) */}
      {/* <aside className="hidden w-56 shrink-0 xl:block" /> */}
    </div>
  );
}
