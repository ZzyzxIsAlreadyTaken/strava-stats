import { NextRequest, NextResponse } from "next/server";
import { getFriendStats } from "@/lib/db";
import { formatDistance, formatTime } from "@/lib/strava-api";

export async function GET(request: NextRequest) {
  try {
    // Get athlete ID from cookies
    const athleteId = request.cookies.get("strava_athlete_id");

    if (!athleteId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get friend ID from query params
    const searchParams = request.nextUrl.searchParams;
    const friendId = searchParams.get("friendId");

    if (!friendId) {
      return NextResponse.json({ error: "Missing friend ID" }, { status: 400 });
    }

    // Get friend stats
    const stats = await getFriendStats(friendId);

    return NextResponse.json({
      stats: {
        totalActivities: stats.totalActivities,
        totalDistance: formatDistance(stats.totalDistance),
        totalTime: formatTime(stats.totalTime),
        averageDistance: formatDistance(stats.averageDistance),
        averageTime: formatTime(stats.averageTime),
      },
    });
  } catch (error) {
    console.error("Error fetching friend stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
