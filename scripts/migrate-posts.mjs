/**
 * 기존 flat content/posts/*.md 파일을 새 폴더 구조로 마이그레이션
 * content/posts/{subcategory}/{slug}/index.md
 * 관련 이미지(heroImage, 인라인 paste 이미지)도 함께 이동
 *
 * 실행: node scripts/migrate-posts.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// gray-matter를 동적으로 import
const { default: matter } = await import("gray-matter");

const GITHUB_OWNER = "jjou33";
const GITHUB_REPO = "hippo-dev-blog";

function rawUrl(filePath) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${encoded}`;
}

const postsDir = join(ROOT, "content/posts");
const publicImagesDir = join(ROOT, "public/post-images");

// flat .md 파일 목록 (디렉토리가 아닌 파일만)
const flatFiles = readdirSync(postsDir).filter((name) => {
  const fullPath = join(postsDir, name);
  return statSync(fullPath).isFile() && name.endsWith(".md");
});

if (flatFiles.length === 0) {
  console.log("마이그레이션할 flat .md 파일이 없습니다.");
  process.exit(0);
}

console.log(`마이그레이션 대상: ${flatFiles.join(", ")}\n`);

for (const filename of flatFiles) {
  const flatPath = join(postsDir, filename);
  const raw = readFileSync(flatPath, "utf-8");
  const { data: frontmatter, content } = matter(raw);

  // slug = 파일명에서 .md 제거
  const slug = filename.replace(/\.md$/, "");
  const subcategory = frontmatter.subcategory?.trim() || "general";
  const postDir = join(postsDir, subcategory, slug);

  console.log(`[${slug}] → content/posts/${subcategory}/${slug}/`);

  mkdirSync(postDir, { recursive: true });

  let updatedFrontmatter = { ...frontmatter };
  let updatedContent = content;

  // ── 히어로 이미지 이동 ──
  const heroImage = frontmatter.heroImage;
  if (heroImage) {
    // 로컬 경로(/post-images/...) 처리
    if (heroImage.startsWith("/post-images/")) {
      const heroFilename = heroImage.replace("/post-images/", "");
      const ext = extname(heroFilename).replace(".", "") || "png";
      const srcPath = join(publicImagesDir, heroFilename);
      const destFilename = `thumbnail.${ext}`;
      const destPath = join(postDir, destFilename);

      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath);
        // 원본 삭제는 모든 포스트 처리 후 별도로 할 수도 있지만, 여기서 바로 제거
        // (다른 포스트가 같은 이미지를 참조하지 않는다고 가정)
        console.log(`  hero: ${heroFilename} → ${subcategory}/${slug}/${destFilename}`);
      } else {
        console.log(`  hero: ${heroFilename} (로컬 파일 없음, 경로만 업데이트)`);
      }

      const newHeroPath = `content/posts/${subcategory}/${slug}/${destFilename}`;
      updatedFrontmatter.heroImage = rawUrl(newHeroPath);
    }
    // 이미 raw GitHub URL이면 그대로 유지
  }

  // ── 인라인 이미지 이동 ──

  // 패턴 1: /post-images/filename
  updatedContent = updatedContent.replace(
    /!\[([^\]]*)\]\(\/post-images\/([^)]+)\)/g,
    (match, alt, imgFilename) => {
      const srcPath = join(publicImagesDir, imgFilename);
      const destPath = join(postDir, imgFilename);
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath);
        console.log(`  inline: ${imgFilename} → ${subcategory}/${slug}/${imgFilename}`);
      }
      const newPath = `content/posts/${subcategory}/${slug}/${imgFilename}`;
      return `![${alt}](${rawUrl(newPath)})`;
    }
  );

  // 패턴 2: raw GitHub URL → public/post-images/ (구버전 upload-image API 결과물)
  const rawPublicPattern = new RegExp(
    `https://raw\\.githubusercontent\\.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/public/post-images/([^)\\s"]+)`,
    "g"
  );
  updatedContent = updatedContent.replace(rawPublicPattern, (match, imgFilename) => {
    const srcPath = join(publicImagesDir, imgFilename);
    const destPath = join(postDir, imgFilename);
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
      console.log(`  inline (raw): ${imgFilename} → ${subcategory}/${slug}/${imgFilename}`);
    }
    const newPath = `content/posts/${subcategory}/${slug}/${imgFilename}`;
    return rawUrl(newPath);
  });

  // ── 새 index.md 작성 ──
  const newFileContent = matter.stringify(updatedContent, updatedFrontmatter);
  writeFileSync(join(postDir, "index.md"), newFileContent, "utf-8");

  // ── 기존 flat .md 삭제 ──
  import("fs").then(({ unlinkSync }) => unlinkSync(flatPath));

  console.log(`  ✓ 완료\n`);
}

console.log("마이그레이션 완료!");
console.log("변경된 파일을 git add 후 커밋해 주세요.");
