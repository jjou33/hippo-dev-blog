import { auth } from "@/auth";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;

// GitHub에서 파일 1개 삭제
async function deleteFile(path: string) {
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  if (Array.isArray(data) || data.type !== "file") return;
  await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message: `post: delete ${path}`,
    sha: data.sha,
  });
}

// 디렉토리 내 모든 파일 재귀 삭제
async function deleteDirectory(dirPath: string) {
  let contents;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: dirPath });
    contents = Array.isArray(data) ? data : [data];
  } catch {
    return; // 디렉토리가 없으면 무시
  }

  for (const item of contents) {
    if (item.type === "file") {
      await deleteFile(item.path);
    } else if (item.type === "dir") {
      await deleteDirectory(item.path);
    }
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "slug는 필수입니다." }, { status: 400 });
    }

    let deleted = false;

    // 1. 이전 플랫 구조: content/posts/{slug}.md
    try {
      await deleteFile(`content/posts/${slug}.md`);
      deleted = true;
    } catch {
      // 없으면 무시
    }

    // 2. 새 중첩 구조: content/posts/{subcategory}/{slug}/ 탐색
    try {
      const { data: topLevel } = await octokit.repos.getContent({
        owner,
        repo,
        path: "content/posts",
      });

      if (Array.isArray(topLevel)) {
        for (const entry of topLevel) {
          if (entry.type !== "dir") continue;
          // 서브카테고리 폴더 내에 slug 폴더가 있는지 확인
          const slugPath = `${entry.path}/${slug}`;
          try {
            await octokit.repos.getContent({ owner, repo, path: slugPath });
            // 존재하면 폴더 전체 삭제
            await deleteDirectory(slugPath);
            deleted = true;
          } catch {
            // 없으면 무시
          }
        }
      }
    } catch {
      // content/posts 자체가 없으면 무시
    }

    if (!deleted) {
      return NextResponse.json({ error: "포스트를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
