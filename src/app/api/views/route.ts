import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

function getTodayKey() {
  return `views:${new Date().toISOString().split("T")[0]}`;
}

export async function GET() {
  try {
    const todayKey = getTodayKey();
    const [today, total] = await Promise.all([
      kv.get<number>(todayKey),
      kv.get<number>("views:total"),
    ]);
    return NextResponse.json({ today: today ?? 0, total: total ?? 0 });
  } catch {
    return NextResponse.json({ today: 0, total: 0 });
  }
}

export async function POST() {
  try {
    const todayKey = getTodayKey();
    const [today, total] = await Promise.all([
      kv.incr(todayKey),
      kv.incr("views:total"),
    ]);
    // 오늘 카운터는 7일 후 자동 만료
    await kv.expire(todayKey, 60 * 60 * 24 * 7);
    return NextResponse.json({ today, total });
  } catch {
    return NextResponse.json({ today: 0, total: 0 });
  }
}
