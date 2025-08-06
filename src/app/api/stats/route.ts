import { NextRequest, NextResponse } from "next/server";
import { getUserActivities } from "@/lib/db";
import { calculateStats, formatDistance, formatTime } from "@/lib/strava-api";

export async function GET(request: NextRequest) {
  try {
    // Get athlete ID from cookies
    const athleteId = request.cookies.get("strava_athlete_id");

    if (!athleteId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    // Get user activities from database with pagination
    const activities = await getUserActivities(athleteId.value, page, perPage);

    // Get all activities for stats calculation (without pagination)
    const allActivities = await getUserActivities(athleteId.value, 1, 10000); // Large limit to get all

    // Convert database activities to StravaActivity format for stats
    const stravaActivities = allActivities.map((activity) => ({
      id: parseInt(activity.id),
      name: activity.name || "",
      type: activity.type || "",
      distance: activity.distance || 0,
      moving_time: activity.movingTime || 0,
      start_date: activity.startDate?.toISOString() || "",
      total_elevation_gain: 0,
      average_speed: 0,
      max_speed: 0,
    }));

    // Calculate stats
    const stats = calculateStats(stravaActivities);

    return NextResponse.json({
      stats: {
        totalActivities: stats.totalActivities,
        totalDistance: formatDistance(stats.totalDistance),
        totalTime: formatTime(stats.totalTime),
        averageDistance: formatDistance(stats.averageDistance),
        averageTime: formatTime(stats.averageTime),
      },
      activities: activities,
      pagination: {
        page,
        perPage,
        totalActivities: stats.totalActivities,
        totalPages: Math.ceil(stats.totalActivities / perPage),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
