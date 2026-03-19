import { auth } from "@/auth";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import matter from "gray-matter";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await request.json();
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
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "제목, 슬러그, 내용은 필수입니다." },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: "GitHub에 커밋되었습니다.",
      path: filePath,
    });
  } catch (err) {
    console.error("Failed to save post:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "저장에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
