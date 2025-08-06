import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return redirect("/?error=oauth_error");
  }

  if (!code) {
    console.error("No authorization code received");
    return redirect("/?error=no_code");
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return redirect("/?error=token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();

    // Get athlete info
    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!athleteResponse.ok) {
      console.error("Failed to fetch athlete data");
      return redirect("/?error=athlete_fetch_failed");
    }

    const athlete = await athleteResponse.json();

    // For now, redirect to main page with success
    // In a real app, you'd store the session securely
    return redirect("/?authenticated=true");
  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirect("/?error=callback_error");
  }
}
