import { Header } from "@/components/blog/header";
import { Sidebar } from "@/components/blog/sidebar";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { Breadcrumb } from "@/components/blog/breadcrumb";
import { BlogContent } from "@/components/blog/content";
import { MobileSidebar } from "@/components/blog/mobile-sidebar";
import { navigationData, tableOfContentsData, logo } from "@/lib/blog-data";

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
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className=" max-w-full px-2 lg:px-3">
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar
            sections={navigationData}
            logo={logo}
            visitorStats={visitorStats}
          />

          {/* Main Content */}
          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
            <Breadcrumb items={breadcrumbItems} />
            <BlogContent />
          </main>

          {/* Right Sidebar - Table of Contents */}
          <TableOfContents items={tableOfContentsData} />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar sections={navigationData} />
    </div>
  );
}
