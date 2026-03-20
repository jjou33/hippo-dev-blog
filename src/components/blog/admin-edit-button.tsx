"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminEditButton({ slug }: { slug: string }) {
  const { data: session } = useSession();

  if (!session || session.user.role !== "admin") return null;

  return (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <Link href={`/admin/edit/${encodeURIComponent(slug)}`}>
        <Pencil className="h-4 w-4" />
        수정
      </Link>
    </Button>
  );
}
