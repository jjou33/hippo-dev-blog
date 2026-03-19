import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// public/icons/ 디렉토리의 SVG 파일 목록을 반환
export async function GET() {
  const iconsDir = path.join(process.cwd(), "public/icons");

  if (!fs.existsSync(iconsDir)) {
    return NextResponse.json({ icons: [] });
  }

  const files = fs.readdirSync(iconsDir);
  const icons = files
    .filter((file) => file.endsWith(".svg"))
    .map((file) => file.replace(/\.svg$/, ""));

  return NextResponse.json({ icons });
}
