"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";

interface HeroSectionProps {
  postCount: number;
  topTags: string[];
  featuredPosts: BlogPost[];
}

const TITLE = "Hippo Dev Blog";

function useTypingEffect(text: string, speed = 80) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

export function HeroSection({
  postCount,
  topTags,
  featuredPosts,
}: HeroSectionProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const { displayed, done } = useTypingEffect(TITLE);

  // ── parallax ──────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (imgRef.current) {
        const translateY = window.scrollY * 0.25;
        imgRef.current.style.transform = `translateY(-${translateY}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToContent = () => {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
  };

  // ── 캐러셀 ────────────────────────────────────────────────────
  // 3개 카드를 동시에 표시. 앞 3개 복제본을 끝에 추가 → 마지막→처음 전환이 자연스럽게
  const VISIBLE = 2;
  const items =
    featuredPosts.length > 0
      ? [...featuredPosts, ...featuredPosts.slice(0, VISIBLE)]
      : [];
  const [carouselIdx, setCarouselIdx] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const TRANSITION = "transform 0.85s cubic-bezier(0.25,0.46,0.45,0.94)";

  // goNext: 복제본 시작 위치(featuredPosts.length)까지 진행
  const goNext = useCallback(
    () => setCarouselIdx((i) => Math.min(i + 1, featuredPosts.length)),
    [featuredPosts.length],
  );
  const goPrev = useCallback(() => {
    if (carouselIdx === 0) {
      // idx=0에서 이전: 트랜지션 없이 n-1로 점프
      if (stripRef.current) {
        stripRef.current.style.transition = "none";
        setCarouselIdx(featuredPosts.length - 1);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (stripRef.current) {
              stripRef.current.style.transition = TRANSITION;
            }
          }),
        );
      }
    } else {
      setCarouselIdx(carouselIdx - 1);
    }
  }, [carouselIdx, featuredPosts.length]);

  // 자동 재생
  useEffect(() => {
    if (featuredPosts.length < 2) return;
    autoRef.current = setInterval(goNext, 5000);
    return () => clearInterval(autoRef.current);
  }, [goNext, featuredPosts.length]);

  // 복제본 구간(featuredPosts.length)에 도달 → 0.85s 트랜지션 완료 후 idx=0으로 무음 리셋
  // idx=0과 복제본 구간은 동일한 뷰 → 시각적으로 끊김 없음
  useEffect(() => {
    if (featuredPosts.length < 2) return;
    if (carouselIdx === featuredPosts.length) {
      const t = setTimeout(() => {
        if (stripRef.current) {
          stripRef.current.style.transition = "none";
          setCarouselIdx(0);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (stripRef.current) {
                stripRef.current.style.transition = TRANSITION;
              }
            }),
          );
        }
      }, 950); // 0.85s 트랜지션 + 여유
      return () => clearTimeout(t);
    }
  }, [carouselIdx, featuredPosts.length]);

  // 마우스오버 시 자동재생 일시정지
  const pauseAuto = () => clearInterval(autoRef.current);
  const resumeAuto = () => {
    if (featuredPosts.length < 2) return;
    autoRef.current = setInterval(goNext, 5000);
  };

  const activeDot = carouselIdx % (featuredPosts.length || 1);

  return (
    <section className="sticky top-14 h-[75vh] w-full overflow-hidden">
      {/* Hero GIF */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src="/hero.gif"
        alt="Hero background"
        className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover object-center will-change-transform"
      />

      {/* Dimmed 오버레이 */}
      <div className="absolute inset-0 bg-black/60" />

      {/* 좌우 레이아웃 */}
      <div className="flex justify-center lg:justify-between absolute inset-0 items-center px-6 py-8 text-white md:px-14">
        {/* ── 왼쪽: 타이틀 영역 (모바일: 중앙 정렬) ── */}
        <div className="flex flex-col justify-center items-center text-center lg:items-start lg:text-left gap-3 flex-1 max-w-lg lg:ml-30 mt-15">
          <span className="inline-flex w-fit items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
            DEV BLOG
          </span>

          <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg md:text-5xl lg:text-6xl">
            {displayed}
            {!done && (
              <span className="inline-block w-[3px] h-[1em] bg-white ml-1 align-middle animate-pulse" />
            )}
          </h1>

          <p className="text-sm text-white/70 drop-shadow md:text-base">
            개발자의 경험과 인사이트를 기록합니다
          </p>

          <div className="flex justify-center lg:justify-start gap-3 pt-1">
            <button
              onClick={handleScrollToContent}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              포스트 보러가기
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              About
            </Link>
          </div>

          {/* 통계 + 태그 */}
          <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-white/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{postCount}개 포스트</span>
            </div>
            <div className="h-3.5 w-px bg-white/20" />
            {topTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm"
              >
                <span className="text-white/50">#</span>
                <span>{tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 오른쪽: 캐러셀 (lg+) ── */}
        {featuredPosts.length > 0 && (
          <div
            className="hidden lg:flex flex-col gap-3 w-[420px] xl:w-[480px] shrink-0 py-1"
            onMouseEnter={pauseAuto}
            onMouseLeave={resumeAuto}
          >
            {/* 헤더: 레이블 + 화살표 */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest uppercase text-white/50">
                추천 포스트
              </span>
              <div className="flex gap-1">
                <button
                  onClick={goPrev}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/25"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={goNext}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/25"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* 캐러셀 뷰포트 */}
            <div className="h-[420px] overflow-hidden rounded-xl">
              {/* 슬라이드 트랙: 아이템마다 1/3 너비, 높이 100% */}
              <div
                ref={stripRef}
                className="flex h-full items-center"
                style={{
                  transform: `translateX(-${carouselIdx * (100 / items.length)}%)`,
                  transition: TRANSITION,
                  width: `${(items.length * 100) / VISIBLE}%`,
                }}
              >
                {items.map((post, i) => (
                  <div
                    key={`${post.slug}-${i}`}
                    style={{ width: `${100 / items.length}%` }}
                    className="flex-none h-[300px] px-1.5"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/12 hover:border-white/25"
                    >
                      {/* 썸네일: flex-1 로 카드 높이 대부분 차지 */}
                      <div className="relative flex-1 min-h-0 overflow-hidden">
                        {post.heroImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.heroImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-linear-to-br from-white/10 to-white/5" />
                        )}
                        {/* 카테고리 뱃지 */}
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                          {post.subcategory}
                        </span>
                        {/* 하단 그라디언트 */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/60 to-transparent" />
                      </div>

                      {/* 텍스트 */}
                      <div className="shrink-0 flex flex-col gap-1 p-3">
                        <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-white">
                          {post.title}
                        </p>
                        <p className="text-[10px] text-white/40">{post.date}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 도트 인디케이터 */}
            <div className="flex justify-center gap-1.5">
              {featuredPosts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeDot
                      ? "w-4 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface PostHeroSectionProps {
  src: string;
  alt?: string;
}

export function PostHeroSection({
  src,
  alt = "포스트 히어로 이미지",
}: PostHeroSectionProps) {
  return (
    <div className="relative flex items-center justify-center h-[50vh] w-full overflow-hidden md:h-[55vh] lg:h-[60vh]">
      {/* 블러 배경 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center scale-110 blur-2xl brightness-75"
      />
      {/* 원본 이미지 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="relative h-[85%] w-[85%] object-contain object-center"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-background opacity-50" />
    </div>
  );
}
