import { getAllPosts } from "@/lib/posts";
import { PostsListContent } from "@/components/blog/posts-list-content";
import { auth } from "@/auth";

export const metadata = {
  title: "전체 포스트",
  description: "모든 블로그 포스트를 확인하세요.",
};

export default async function BlogListPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const allPosts = getAllPosts();
  const posts = isAdmin ? allPosts : allPosts.filter((p) => !p.adminOnly);
  return <PostsListContent posts={posts} />;
}
