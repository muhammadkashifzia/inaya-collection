import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand cache revalidation endpoint.
 *
 * Called by the Laravel admin backend after any content mutation so the
 * storefront reflects changes immediately — no hard refresh needed.
 *
 * POST /api/revalidate
 * Body: { "secret": "...", "tags": ["home", "products"] }
 */
export async function POST(request: NextRequest) {
  let body: { secret?: string; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const secret = process.env.REVALIDATION_SECRET;
  if (!secret || body.secret !== secret) {
    return NextResponse.json({ message: "Invalid secret." }, { status: 401 });
  }

  const tags = body.tags;
  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ message: "Provide a non-empty tags array." }, { status: 400 });
  }

  const revalidated: string[] = [];
  for (const tag of tags) {
    if (typeof tag === "string" && tag.length > 0 && tag.length <= 128) {
      revalidateTag(tag, { expire: 0 });
      revalidated.push(tag);
    }
  }

  return NextResponse.json({ revalidated, now: Date.now() });
}
