import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

// Two upload targets. Product photos stay in the tight 8MB image-only bucket;
// Stage background media (which can be a short video) goes to the larger
// site-media bucket. The kind comes from the form so one route serves both.
const TARGETS = {
  product: {
    bucket: "product-images",
    maxBytes: 8 * 1024 * 1024,
    types: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  },
  background: {
    bucket: "site-media",
    maxBytes: 50 * 1024 * 1024,
    types: new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]),
  },
} as const;

function extensionFor(mimeType: string): string {
  return EXTENSIONS[mimeType] ?? "bin";
}

// Uploads one image straight from the admin's computer to Supabase Storage.
// Never a direct client-to-Storage upload — always through here, so the
// business_id path prefix and admin check can't be bypassed.
export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessAdmin(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "background" ? "background" : "product";
  const target = TARGETS[kind];
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!target.types.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > target.maxBytes) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `${business.id}/${crypto.randomUUID()}.${extensionFor(file.type)}`;

  const service = getServiceSupabase();
  const { error } = await service.storage
    .from(target.bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data } = service.storage.from(target.bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
