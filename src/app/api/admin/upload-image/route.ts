import { auth } from "@/auth";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { base64, ext, subcategory, slug } = await request.json();

    if (!base64 || !ext) {
      return NextResponse.json({ error: "base64와 ext는 필수입니다." }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "슬러그를 먼저 입력해 주세요." }, { status: 400 });
    }

    // data URL에서 순수 base64 추출
    const base64Data = base64.replace(/^data:image\/[^;]+;base64,/, "");

    // 포스트 폴더 경로
    const subcatFolder = subcategory?.trim() || "general";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 7);
    const filename = `paste-${timestamp}-${random}.${ext}`;
    const imagePath = `content/posts/${subcatFolder}/${slug}/${filename}`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: `asset: add inline image ${filename}`,
      content: base64Data,
    });

    // raw.githubusercontent.com URL은 배포 없이 즉시 접근 가능
    const encoded = imagePath.split("/").map(encodeURIComponent).join("/");
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${encoded}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Failed to upload image:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "이미지 업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
