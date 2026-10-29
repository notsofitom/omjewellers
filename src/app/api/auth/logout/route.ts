
import { NextResponse } from "next/server";
import { destroyOwnerSession } from "@/lib/auth";

export async function POST() {
  try {
    await destroyOwnerSession();

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Logout API error:", error);

    return NextResponse.json(
      { error: "Unable to log out." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
