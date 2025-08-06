import { redirect } from "next/navigation";

function getBaseUrl() {
  // Prioritize AUTH_URL if set (for custom domains)
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }

  // In development, use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Fallback to VERCEL_URL if no AUTH_URL is set
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Final fallback
  return "http://localhost:3000";
}

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;

  if (!clientId) {
    console.error("Missing STRAVA_CLIENT_ID");
    return redirect("/");
  }

  const redirectUri = `${getBaseUrl()}/api/auth/callback/strava`;
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=auto&scope=read,activity:read_all`;

  return redirect(stravaAuthUrl);
}
