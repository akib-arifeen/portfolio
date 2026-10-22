// Photobooth restyle — the browser never sees the API key.
// POST { image: dataURL(jpeg), style }  -> { taskId }
// GET  ?taskId=...                       -> { state: "waiting" | "success" | "fail", image?: dataURL, error? }
//
// Env:  KIE_API_KEY        your personal kie.ai key (required for real runs)
//       KIE_IMAGE_MODEL    default "gpt-image-2-5-flare-image-to-image" (GPT Image 2.5 Flare — the faster one, so guests wait less);
//                          "gpt-image-2-5-sunburst-image-to-image" for higher quality. Source: https://kie.ai/gpt-image-2-5
//       BOOTH_MOCK=1       free test mode: returns the visitor's own photo after a short delay, spends nothing
//
// Nothing is stored by this site. In real mode the photo is uploaded to kie.ai's temporary file store
// and sent to the image model once.

import { NextResponse, type NextRequest } from "next/server";
import { BOOTH_DAILY_LIMIT, styles, type StyleId } from "@/lib/booth";
import { stylePrompts } from "@/lib/booth-prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://api.kie.ai/api/v1";
const UPLOAD = "https://kieai.redpandaai.co/api/file-stream-upload";
const MAX_BYTES = 3_000_000;

const mockMode = () => process.env.BOOTH_MOCK === "1";
const apiKey = () => process.env.KIE_API_KEY ?? "";

// Per-visitor daily limit, in memory per server instance. Before setting KIE_API_KEY on a serverless host, move it
// to a shared store (Upstash or Redis), add a global daily cap and set a spend cap on the kie.ai account.
const usage = new Map<string, { day: string; count: number }>();
function allow(ip: string) {
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(ip);
  if (!u || u.day !== day) { usage.set(ip, { day, count: 1 }); return true; }
  if (u.count >= BOOTH_DAILY_LIMIT) return false;
  u.count += 1;
  return true;
}

// Mock tasks keep the visitor's photo in memory for a few seconds only.
const mockTasks = new Map<string, { image: string; readyAt: number }>();

function ipOf(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

async function kie(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.code && data.code !== 200)) throw new Error(data.msg || `kie ${res.status}`);
  return data;
}

export async function POST(req: NextRequest) {
  if (!mockMode() && !apiKey()) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const image: unknown = body?.image;
  const styleId: unknown = body?.style;
  const style = styles.find((s) => s.id === (styleId as StyleId));
  if (typeof image !== "string" || !image.startsWith("data:image/jpeg;base64,") || !style) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const bytes = Buffer.from(image.slice("data:image/jpeg;base64,".length), "base64");
  if (bytes.length > MAX_BYTES) return NextResponse.json({ error: "too-large" }, { status: 413 });
  if (!mockMode() && !allow(ipOf(req))) return NextResponse.json({ error: "limit" }, { status: 429 }); // test mode spends nothing, so it isn't limited

  if (mockMode()) {
    const taskId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    mockTasks.set(taskId, { image, readyAt: Date.now() + 4000 });
    return NextResponse.json({ taskId });
  }

  try {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "image/jpeg" }), "booth.jpg");
    form.append("uploadPath", "images");
    const up = await fetch(UPLOAD, { method: "POST", headers: { Authorization: `Bearer ${apiKey()}` }, body: form, signal: AbortSignal.timeout(30_000) });
    const upData = await up.json().catch(() => ({}));
    const url: string | undefined = upData?.data?.downloadUrl;
    if (!up.ok || !url) throw new Error(upData?.msg || "upload failed");

    const task = await kie("/jobs/createTask", {
      method: "POST",
      body: JSON.stringify({
        model: process.env.KIE_IMAGE_MODEL || "gpt-image-2-5-flare-image-to-image",
        input: { prompt: stylePrompts[style.id], input_urls: [url], aspect_ratio: "3:4", resolution: "1K" },
      }),
    });
    const taskId: string | undefined = task?.data?.taskId;
    if (!taskId) throw new Error("no task id");
    return NextResponse.json({ taskId });
  } catch (e) {
    console.error("[booth] create failed:", (e as Error).message);
    return NextResponse.json({ error: "provider" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId") ?? "";
  if (!/^[\w-]{6,80}$/.test(taskId)) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  if (taskId.startsWith("mock-")) {
    const t = mockTasks.get(taskId);
    if (!t) return NextResponse.json({ state: "fail", error: "expired" });
    if (Date.now() < t.readyAt) return NextResponse.json({ state: "waiting" });
    mockTasks.delete(taskId);
    return NextResponse.json({ state: "success", image: t.image, mock: true });
  }
  if (!apiKey()) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  try {
    const info = await kie(`/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { method: "GET" });
    const d = info?.data ?? {};
    if (d.state === "fail") return NextResponse.json({ state: "fail", error: d.failMsg || "generation failed" });
    if (d.state !== "success") return NextResponse.json({ state: "waiting" });
    const resultUrl: string | undefined = JSON.parse(d.resultJson || "{}")?.resultUrls?.[0];
    if (!resultUrl) return NextResponse.json({ state: "fail", error: "no result" });
    // Proxy the bytes so the browser can draw the result onto its card canvas (no cross-origin taint).
    const img = await fetch(resultUrl, { signal: AbortSignal.timeout(30_000) });
    const buf = Buffer.from(await img.arrayBuffer());
    const type = img.headers.get("content-type")?.startsWith("image/") ? img.headers.get("content-type") : "image/png";
    return NextResponse.json({ state: "success", image: `data:${type};base64,${buf.toString("base64")}` });
  } catch (e) {
    console.error("[booth] status failed:", (e as Error).message);
    return NextResponse.json({ state: "waiting" });
  }
}
