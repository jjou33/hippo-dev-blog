import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const postsDirectory = path.join(process.cwd(), "content/posts");

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  const absolutePath = path.resolve(postsDirectory, filePath);

  // 경로 순회 공격 방지
  if (!absolutePath.startsWith(postsDirectory)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase().slice(1);
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
