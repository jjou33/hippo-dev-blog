import { Header } from "@/components/blog/header";
import { Sidebar } from "@/components/blog/sidebar";
import { MobileSidebar } from "@/components/blog/mobile-sidebar";
import { HeroSection } from "@/components/blog/hero-section";
import { HomeContent } from "@/components/blog/home-content";
import { getNavigationFromPosts, getAllPosts } from "@/lib/posts";
import { logo } from "@/lib/blog-data";
import { auth } from "@/auth";

const visitorStats = {
  today: 100,
  total: 1000,
};

export default async function DocsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const allPosts = getAllPosts();
  const posts = isAdmin ? allPosts : allPosts.filter((p) => !p.adminOnly);
  const navigationData = getNavigationFromPosts(undefined, posts);

  // 포스트 수 및 상위 태그 계산
  const postCount = posts.length;
  const tagCounts = posts
    .flatMap((p) => p.tags)
    .reduce((acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  return (
    <div className="bg-background">
      <Header posts={posts} />

      <div className="max-w-full ">
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar
            sections={navigationData}
            logo={logo}
            visitorStats={visitorStats}
          />

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <HeroSection postCount={postCount} topTags={topTags} featuredPosts={posts.filter((p) => p.featured)} />

            {/* 스크롤 시 Hero 위로 덮으며 올라오는 컨텐츠 */}
            <div className="relative z-10 bg-background border-0 outline-none">
              {/* 물결 애니메이션 구분선 */}
              <div className="absolute -top-20 left-0 w-full h-20 overflow-hidden pointer-events-none border-0 outline-none mt-1">
                <div className="wave-scroll flex w-[200%] h-full">
                  <svg
                    viewBox="0 0 1440 80"
                    className="w-1/2 h-full shrink-0 border-0"
                    preserveAspectRatio="none"
                    style={{
                      fill: "var(--background)",
                      stroke: "none",
                      display: "block",
                    }}
                  >
                    <path
                      d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
                      stroke="none"
                    />
                  </svg>
                  <svg
                    viewBox="0 0 1440 80"
                    className="w-1/2 h-full shrink-0 border-0"
                    preserveAspectRatio="none"
                    style={{
                      fill: "var(--background)",
                      stroke: "none",
                      display: "block",
                    }}
                  >
                    <path
                      d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
                      stroke="none"
                    />
                  </svg>
                </div>
              </div>

              <HomeContent posts={posts} />
            </div>
          </main>

          {/* Right Sidebar - Table of Contents */}
          {/* <TableOfContents items={tableOfContentsData} /> */}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar sections={navigationData} />
    </div>
  );
}
