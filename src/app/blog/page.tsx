import { getAllPosts } from "@/lib/posts";
import { PostsListContent } from "@/components/blog/posts-list-content";

export const metadata = {
  title: "전체 포스트",
  description: "모든 블로그 포스트를 확인하세요.",
};

export default function BlogListPage() {
  const posts = getAllPosts();
  return <PostsListContent posts={posts} />;
}
