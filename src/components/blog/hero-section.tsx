"use client";

import { useEffect, useRef } from "react";

export function HeroSection() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (imgRef.current) {
        // 스크롤 시 이미지가 위로 천천히 이동 (parallax)
        const translateY = window.scrollY * 0.25;
        imgRef.current.style.transform = `translateY(-${translateY}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="sticky top-14 h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Hero GIF - parallax 효과, 중앙이 항상 보이도록 여유 높이 확보 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src="/hero.gif"
        alt="Hero background"
        className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover object-center will-change-transform"
      />

      {/* Dimmed 오버레이 */}
      <div className="absolute inset-0 bg-black/55" />

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-white">
        <h1 className="text-5xl font-bold tracking-tight drop-shadow-lg md:text-6xl lg:text-7xl">
          Hippo Dev Blog
        </h1>
        <p className="max-w-xl text-lg text-white/75 drop-shadow md:text-xl">
          개발자의 경험과 인사이트를 기록합니다
        </p>
      </div>

      {/* 스크롤 유도 아이콘 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/60 animate-bounce">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

interface PostHeroSectionProps {
  src: string;
  alt?: string;
}

export function PostHeroSection({ src, alt = "포스트 히어로 이미지" }: PostHeroSectionProps) {
  return (
    <div className="relative h-[50vh] w-full overflow-hidden md:h-[55vh] lg:h-[60vh]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
      />
      {/* 하단 그라디언트 - 콘텐츠로 자연스럽게 이어지도록 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
    </div>
  );
}
