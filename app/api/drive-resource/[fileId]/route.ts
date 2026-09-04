import { getActor } from "@/lib/auth";
import { fetchDriveFile, driveConfigured } from "@/lib/googleDrive";
import { NextResponse } from "next/server";

// Streams bytes, so it cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves a supporting document (a cookbook, guidelines PDF) that lives in the
 * same private Drive folder as lesson videos, for files too large for the
 * lesson-resources Storage bucket. Not lesson- or enrollment-scoped like the
 * video/audio routes - a cookbook is a shared teaching resource, not the
 * course's gated IP, so "signed in" is the bar, matching the public
 * lesson-resources bucket used for everything that does fit there.
 */
export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;

  if (!driveConfigured()) {
    return NextResponse.json({ message: "Drive hosting is not configured" }, { status: 501 });
  }

  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const range = request.headers.get("range");
  const upstream = await fetchDriveFile(fileId, range);

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { message: "Could not load the file" },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const headers = new Headers();
  for (const header of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }
  headers.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
