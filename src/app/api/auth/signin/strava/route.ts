import { redirect } from "next/navigation";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error("Missing STRAVA_CLIENT_ID or STRAVA_REDIRECT_URI");
    return redirect("/");
  }

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=auto&scope=read,activity:read_all`;

  return redirect(stravaAuthUrl);
}
