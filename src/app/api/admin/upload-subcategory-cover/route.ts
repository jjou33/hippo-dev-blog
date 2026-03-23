import { auth } from "@/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { findSubcategoryFolder } from "@/lib/posts";

const postsDirectory = path.join(process.cwd(), "content/posts");

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { subcategory, base64, ext } = await request.json();

    if (!subcategory || !base64 || !ext) {
      return NextResponse.json({ error: "필수 파라미터가 없습니다." }, { status: 400 });
    }

    // subcategory에 해당하는 폴더 탐색
    const folder = findSubcategoryFolder(subcategory);
    if (!folder) {
      return NextResponse.json({ error: `'${subcategory}' 에 해당하는 폴더를 찾을 수 없습니다.` }, { status: 404 });
    }

    // 기존 cover 파일 제거
    const coverExts = ["png", "jpg", "jpeg", "gif", "webp"];
    for (const oldExt of coverExts) {
      const oldPath = path.join(postsDirectory, folder, `cover.${oldExt}`);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // 새 cover 파일 저장
    const base64Data = base64.replace(/^data:image\/[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const savePath = path.join(postsDirectory, folder, `cover.${ext}`);
    fs.writeFileSync(savePath, buffer);

    const imageUrl = `/api/content-image?path=${encodeURIComponent(`${folder}/cover.${ext}`)}`;
    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error("Failed to upload subcategory cover:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
