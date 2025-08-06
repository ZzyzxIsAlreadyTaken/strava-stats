import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET() {
  // Clear the session cookies
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000")
  );

  response.cookies.delete("strava_access_token");
  response.cookies.delete("strava_refresh_token");
  response.cookies.delete("strava_athlete_id");

  return response;
}
