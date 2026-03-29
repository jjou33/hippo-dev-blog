import Image from "next/image";

interface SubcategoryCoverSectionProps {
  subcategory: string;
  coverImage: string | null;
}

export function SubcategoryCoverSection({ subcategory, coverImage }: SubcategoryCoverSectionProps) {
  if (!coverImage) return null;

  return (
    <div className="relative mb-8 flex items-center justify-center overflow-hidden rounded-xl h-56 sm:h-80">
      {/* 블러 배경 */}
      <Image
        src={coverImage}
        alt=""
        fill
        aria-hidden
        className="object-cover scale-110 blur-2xl brightness-75"
        sizes="100vw"
      />
      {/* 원본 이미지 (가로 꽉 채움) */}
      <div className="relative h-[85%] w-full">
        <Image
          src={coverImage}
          alt={`${subcategory} 커버`}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}
