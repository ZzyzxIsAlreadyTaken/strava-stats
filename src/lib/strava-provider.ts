import { OAuthConfig } from "@auth/core/providers";

interface StravaProfile {
  id: number;
  username: string;
  profile: string;
}

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

export const strava: OAuthConfig<StravaProfile> = {
  id: "strava",
  name: "Strava",
  type: "oauth",
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  authorization: {
    url: "https://www.strava.com/oauth/authorize",
    params: {
      client_id: process.env.STRAVA_CLIENT_ID,
      response_type: "code",
      redirect_uri: `${getBaseUrl()}/api/auth/callback/strava`,
      approval_prompt: "auto",
      scope: "read,activity:read_all",
    },
  },
  token: "https://www.strava.com/oauth/token",
  userinfo: {
    url: "https://www.strava.com/api/v3/athlete",
  },
  async profile(profile) {
    return {
      id: String(profile.id),
      name: profile.username,
      image: profile.profile, // profile picture URL
    };
  },
};
