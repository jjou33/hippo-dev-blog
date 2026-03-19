import { auth } from "@/auth";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import matter from "gray-matter";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;

type DraftPost = {
  id: string;
  title: string;
  slug: string;
  description: string;
  section: string;
  sectionIcon: string;
  category: string;
  categoryIcon: string;
  content: string;
  date: string;
  author: string;
  savedAt: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { drafts } = await request.json();

    if (!Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json(
        { error: "발행할 draft가 없습니다." },
        { status: 400 }
      );
    }

    const results: { slug: string; path: string }[] = [];

    for (const draft of drafts as DraftPost[]) {
      const {
        title,
        slug,
        description,
        section,
        sectionIcon,
        category,
        categoryIcon,
        content,
        date,
        author,
      } = draft;

      if (!title || !slug || !content) continue;

      const fileContent = matter.stringify(content, {
        title,
        description: description ?? "",
        section: section ?? "",
        ...(sectionIcon ? { sectionIcon } : {}),
        category: category ?? "",
        ...(categoryIcon ? { categoryIcon } : {}),
        date: date ?? new Date().toISOString().split("T")[0],
        author: author ?? "admin",
      });

      const filePath = `content/posts/${slug}.md`;
      const encoded = Buffer.from(fileContent).toString("base64");

      let sha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
        });
        if (!Array.isArray(data) && data.type === "file") {
          sha = data.sha;
        }
      } catch {
        // 파일이 없으면 새로 생성
      }

      const commitMessage = sha
        ? `post: update ${slug}`
        : `post: add ${slug}`;

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: commitMessage,
        content: encoded,
        sha,
      });

      results.push({ slug, path: filePath });
    }

    return NextResponse.json({
      success: true,
      published: results.length,
      results,
    });
  } catch (err) {
    console.error("Failed to publish posts:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "발행에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
