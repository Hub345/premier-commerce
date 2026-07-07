import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

function extensionFor(mimeType: string): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[mimeType] ?? "bin";
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
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `${business.id}/${crypto.randomUUID()}.${extensionFor(file.type)}`;

  const service = getServiceSupabase();
  const { error } = await service.storage
    .from("product-images")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data } = service.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
