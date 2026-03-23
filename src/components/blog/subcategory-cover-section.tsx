import Image from "next/image";

interface SubcategoryCoverSectionProps {
  subcategory: string;
  coverImage: string | null;
}

export function SubcategoryCoverSection({ subcategory, coverImage }: SubcategoryCoverSectionProps) {
  if (!coverImage) return null;

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl">
      <div className="relative h-56 w-full sm:h-80">
        <Image
          src={coverImage}
          alt={`${subcategory} 커버`}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      </div>
    </div>
  );
}
