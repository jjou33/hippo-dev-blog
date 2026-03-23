import { notFound } from "next/navigation";
import { getAllPosts, getPostsBySubcategory } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";
import { TableOfContents } from "@/components/blog/table-of-contents";

interface SubcategoryPageProps {
  params: Promise<{ segments: string[] }>;
}

// SSG: 모든 subcategory 조합에 대해 정적 페이지 생성
export async function generateStaticParams() {
  const posts = getAllPosts();
  const seen = new Set<string>();
  const params: { segments: string[] }[] = [];

  for (const post of posts) {
    const key = `${post.section}||${post.category}||${post.subcategory}`;
    if (!seen.has(key)) {
      seen.add(key);
      params.push({ segments: [post.section, post.category, post.subcategory] });
    }
  }

  return params;
}

export async function generateMetadata({ params }: SubcategoryPageProps) {
  const { segments } = await params;
  const [section, category, subcategory] = segments.map(decodeURIComponent);

  return {
    title: `${subcategory} | ${category} — ${section}`,
    description: `${section} > ${category} > ${subcategory} 에 속한 포스트 목록`,
  };
}

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  const { segments } = await params;
  const [section, category, subcategory] = segments.map(decodeURIComponent);

  const posts = getPostsBySubcategory(section, category, subcategory);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="flex flex-1 min-w-0">
      <main className="flex-1 min-w-0 px-6 py-8 lg:px-10">
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
          <p className="mt-1.5 text-sm text-muted-foreground">
            {posts.length}개의 포스트
          </p>
        </div>

        {/* 포스트 카드 그리드 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </main>

      {/* 오른쪽 빈 여백 (기존 TOC 레이아웃과 일관성 유지) */}
      <aside className="hidden w-56 shrink-0 xl:block" />
    </div>
  );
}
