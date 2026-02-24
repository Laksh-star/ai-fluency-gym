import { NextResponse } from "next/server";
import { getRunServer } from "@/lib/server-run-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;
  const runId = pathname.split("/").pop();

  if (!runId) {
    return NextResponse.json({ error: "Missing run id." }, { status: 400 });
  }

  const run = await getRunServer(runId);
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  return NextResponse.json({ run });
}
