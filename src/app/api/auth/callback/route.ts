import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    const baseUrl =
      process.env.AUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    return NextResponse.redirect(new URL("/?error=oauth_error", baseUrl));
  }

  if (!code) {
    console.error("No authorization code received");
    const baseUrl =
      process.env.AUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    return NextResponse.redirect(new URL("/?error=no_code", baseUrl));
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
      const baseUrl =
        process.env.AUTH_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", baseUrl)
      );
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
      const baseUrl =
        process.env.AUTH_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");
      return NextResponse.redirect(
        new URL("/?error=athlete_fetch_failed", baseUrl)
      );
    }

    const athlete = await athleteResponse.json();

    // Store session data in cookies (simple approach)
    const baseUrl =
      process.env.AUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const response = NextResponse.redirect(
      new URL("/?authenticated=true", baseUrl)
    );

    // Set cookies with session data
    response.cookies.set("strava_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in,
    });

    response.cookies.set("strava_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    response.cookies.set("strava_athlete_id", athlete.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    const baseUrl =
      process.env.AUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    return NextResponse.redirect(new URL("/?error=callback_error", baseUrl));
  }
}
