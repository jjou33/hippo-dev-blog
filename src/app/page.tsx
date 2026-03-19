import { Header } from "@/components/blog/header";
import { Sidebar } from "@/components/blog/sidebar";
import { Breadcrumb } from "@/components/blog/breadcrumb";
import { BlogContent } from "@/components/blog/content";
import { MobileSidebar } from "@/components/blog/mobile-sidebar";
import { HeroSection } from "@/components/blog/hero-section";
import { getNavigationFromPosts, getAllPosts } from "@/lib/posts";
import { logo } from "@/lib/blog-data";

const breadcrumbItems = [
  { label: "핵심 개념", href: "/docs" },
  { label: "...", href: "#" },
  { label: "데이터 모델링", href: "/docs/data-modeling" },
  { label: "관계 설정" },
];

const visitorStats = {
  today: 100,
  total: 1000,
};

export default function DocsPage() {
  const navigationData = getNavigationFromPosts();
  const posts = getAllPosts();

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
            <HeroSection />

            {/* 스크롤 시 Hero 위로 덮으며 올라오는 컨텐츠 */}
            <div className="relative z-10 bg-background border-0 outline-none">
              {/* 물결 애니메이션 구분선 */}
              <div className="absolute -top-12 left-0 w-full h-12 overflow-hidden pointer-events-none border-0 outline-none mt-1">
                <div className="wave-scroll flex w-[200%] h-full">
                  <svg
                    viewBox="0 0 1440 48"
                    className="w-1/2 h-full shrink-0 border-0"
                    preserveAspectRatio="none"
                    style={{
                      fill: "var(--background)",
                      stroke: "none",
                      display: "block",
                    }}
                  >
                    <path
                      d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z"
                      stroke="none"
                    />
                  </svg>
                  <svg
                    viewBox="0 0 1440 48"
                    className="w-1/2 h-full shrink-0 border-0"
                    preserveAspectRatio="none"
                    style={{
                      fill: "var(--background)",
                      stroke: "none",
                      display: "block",
                    }}
                  >
                    <path
                      d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z"
                      stroke="none"
                    />
                  </svg>
                </div>
              </div>

              <div className="px-4 pt-8 pb-6 lg:px-8">
                <Breadcrumb items={breadcrumbItems} />
                <BlogContent />
              </div>
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
