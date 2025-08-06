import { NextRequest, NextResponse } from "next/server";
import { removeFriend } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get athlete ID from cookies
    const athleteId = request.cookies.get("strava_athlete_id");

    if (!athleteId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: "Missing friend ID" }, { status: 400 });
    }

    // Remove friend
    await removeFriend(athleteId.value, friendId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
