import { Header } from "@/components/blog/header";
import { Sidebar } from "@/components/blog/sidebar";
import { MobileSidebar } from "@/components/blog/mobile-sidebar";
import { getAllPosts, getNavigationFromPosts } from "@/lib/posts";
import { kv } from "@vercel/kv";
import { auth } from "@/auth";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const allPosts = getAllPosts();
  const posts = isAdmin ? allPosts : allPosts.filter((p) => !p.adminOnly);
  // 슬러그 없이 호출 - active 상태는 Sidebar에서 usePathname()으로 처리
  const navigationData = getNavigationFromPosts(undefined, posts);

  let visitorStats = { today: 0, total: 0 };
  try {
    const today = new Date().toISOString().split("T")[0];
    const [todayCount, totalCount] = await Promise.all([
      kv.get<number>(`views:${today}`),
      kv.get<number>("views:total"),
    ]);
    visitorStats = { today: todayCount ?? 0, total: totalCount ?? 0 };
  } catch {
    // KV 미연결 시 무시
  }

  return (
    <div className="min-h-screen bg-background">
      <Header posts={posts} />

      <div className="max-w-full">
        <div className="flex">
          <Sidebar
            sections={navigationData}
            postCount={posts.length}
            visitorStats={visitorStats}
          />
          {children}
        </div>
      </div>

      <MobileSidebar sections={navigationData} />
    </div>
  );
}
