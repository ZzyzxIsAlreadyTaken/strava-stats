import { OAuthConfig } from "@auth/core/providers";

interface StravaProfile {
  id: number;
  username: string;
  profile: string;
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
      redirect_uri: process.env.STRAVA_REDIRECT_URI,
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
