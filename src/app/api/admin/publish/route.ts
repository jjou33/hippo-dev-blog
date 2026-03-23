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
  subcategory: string;
  subcategoryIcon: string;
  content: string;
  date: string;
  author: string;
  savedAt: string;
  heroImageBase64?: string;
  heroImageExt?: string;
  heroImage?: string; // 기존 이미지 경로 유지용
};

// raw.githubusercontent.com URL 생성 헬퍼
function rawUrl(filePath: string): string {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${encoded}`;
}

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
        subcategory,
        subcategoryIcon,
        content,
        date,
        author,
        heroImageBase64,
        heroImageExt,
      } = draft;

      if (!title || !slug || !content) continue;

      // 서브카테고리 폴더명 (없으면 "general")
      const subcatFolder = subcategory?.trim() || "general";
      // 포스트 기본 경로: content/posts/{subcategory}/{slug}/
      const postDir = `content/posts/${subcatFolder}/${slug}`;

      // 히어로 이미지 처리
      let heroImagePath: string | undefined = draft.heroImage;
      if (heroImageBase64 && heroImageExt) {
        const base64Data = heroImageBase64.replace(/^data:image\/[^;]+;base64,/, "");
        const imagePath = `${postDir}/thumbnail.${heroImageExt}`;

        let imageSha: string | undefined;
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: imagePath });
          if (!Array.isArray(data) && data.type === "file") imageSha = data.sha;
        } catch {
          // 파일이 없으면 새로 생성
        }

        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: imagePath,
          message: `asset: add hero image for ${slug}`,
          content: base64Data,
          sha: imageSha,
        });

        // raw GitHub URL로 저장 (배포 없이 즉시 접근 가능)
        heroImagePath = rawUrl(imagePath);
      }

      const fileContent = matter.stringify(content, {
        title,
        description: description ?? "",
        section: section ?? "",
        ...(sectionIcon ? { sectionIcon } : {}),
        category: category ?? "",
        ...(categoryIcon ? { categoryIcon } : {}),
        subcategory: subcategory ?? "",
        ...(subcategoryIcon ? { subcategoryIcon } : {}),
        date: date ?? new Date().toISOString().split("T")[0],
        author: author ?? "admin",
        ...(heroImagePath ? { heroImage: heroImagePath } : {}),
      });

      const filePath = `${postDir}/index.md`;
      const encoded = Buffer.from(fileContent).toString("base64");

      let sha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
        if (!Array.isArray(data) && data.type === "file") sha = data.sha;
      } catch {
        // 파일이 없으면 새로 생성
      }

      const commitMessage = sha ? `post: update ${slug}` : `post: add ${slug}`;

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
