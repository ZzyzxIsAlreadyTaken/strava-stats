import { NextRequest, NextResponse } from "next/server";
import { getStravaActivities, getStravaAthlete } from "@/lib/strava-api";
import {
  createOrUpdateUser,
  saveActivities,
  getExistingActivityIds,
  getMostRecentActivityDate,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting sync process...");

    // Get access token from cookies
    const accessToken = request.cookies.get("strava_access_token");
    const athleteId = request.cookies.get("strava_athlete_id");

    console.log("Access token exists:", !!accessToken);
    console.log("Athlete ID exists:", !!athleteId);

    if (!accessToken || !athleteId) {
      console.log("Missing authentication cookies");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Fetching athlete data from Strava...");
    // Verify the token is still valid
    const athlete = await getStravaAthlete(accessToken.value);
    if (!athlete) {
      console.log("Failed to fetch athlete data from Strava");
      return NextResponse.json(
        { error: "Failed to fetch athlete data" },
        { status: 500 }
      );
    }

    console.log(
      "Athlete data fetched:",
      athlete.id,
      athlete.firstname,
      athlete.lastname
    );

    console.log("Saving user to database...");
    // Save/update user in database
    await createOrUpdateUser({
      id: athlete.id.toString(),
      name: `${athlete.firstname} ${athlete.lastname}`,
      image: athlete.profile,
      accessToken: accessToken.value,
      refreshToken: request.cookies.get("strava_refresh_token")?.value || "",
      expiresAt: Math.floor(Date.now() / 1000) + 21600, // 6 hours from now
    });

    console.log("Checking for most recent activity in database...");
    // Get the most recent activity date to optimize API calls
    const mostRecentDate = await getMostRecentActivityDate(
      athlete.id.toString()
    );

    console.log("Fetching activities from Strava...");
    // Fetch activities from Strava (only new ones if we have existing data)
    const activities = await getStravaActivities(
      accessToken.value,
      mostRecentDate || undefined
    );
    console.log("Activities fetched from Strava:", activities.length);

    if (activities.length === 0) {
      console.log("No new activities to sync");
      return NextResponse.json({
        success: true,
        activitiesCount: 0,
        user: {
          id: athlete.id,
          name: `${athlete.firstname} ${athlete.lastname}`,
          image: athlete.profile,
        },
      });
    }

    console.log("Checking existing activities in database...");
    // Get existing activity IDs to avoid duplicates
    const existingIds = await getExistingActivityIds(athlete.id.toString());

    console.log("Saving new activities to database...");
    await saveActivities(athlete.id.toString(), activities, existingIds);

    console.log("Sync completed successfully");

    return NextResponse.json({
      success: true,
      activitiesCount: activities.length,
      user: {
        id: athlete.id,
        name: `${athlete.firstname} ${athlete.lastname}`,
        image: athlete.profile,
      },
    });
  } catch (error) {
    console.error("Error syncing data:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
