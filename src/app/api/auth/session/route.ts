import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("strava_access_token");
  const athleteId = request.cookies.get("strava_athlete_id");

  if (!accessToken || !athleteId) {
    return NextResponse.json({ user: null });
  }

  try {
    // Verify the token is still valid by fetching athlete data
    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      }
    );

    if (!athleteResponse.ok) {
      // Token is invalid, clear cookies
      const response = NextResponse.json({ user: null });
      response.cookies.delete("strava_access_token");
      response.cookies.delete("strava_refresh_token");
      response.cookies.delete("strava_athlete_id");
      return response;
    }

    const athlete = await athleteResponse.json();

    return NextResponse.json({
      user: {
        id: athlete.id.toString(),
        name: `${athlete.firstname} ${athlete.lastname}`,
        image: athlete.profile,
      },
      accessToken: accessToken.value,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json({ user: null });
  }
}
