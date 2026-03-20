import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data } = await supabase
    .from("post_stats")
    .select("views")
    .eq("slug", slug)
    .single();

  return NextResponse.json({ views: data?.views ?? 0 });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data, error } = await supabase.rpc("increment_views", {
    post_slug: slug,
  });

  if (error) {
    return NextResponse.json({ views: 0 }, { status: 500 });
  }

  return NextResponse.json({ views: data ?? 0 });
}
