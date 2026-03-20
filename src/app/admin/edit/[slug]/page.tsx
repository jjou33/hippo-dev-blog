import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPostBySlug } from "@/lib/posts";
import { EditPageContent } from "./edit-page-content";

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return <EditPageContent post={post} />;
}
