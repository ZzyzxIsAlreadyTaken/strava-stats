// app/api/auth/route.ts
import { Auth } from "@auth/core";
import { strava } from "@/lib/strava-provider";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return Auth(req, {
    providers: [strava],
    secret: process.env.AUTH_SECRET,
    callbacks: {
      async jwt({ token, account, profile }) {
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.stravaId = profile?.id;
        }
        return token;
      },
      async session({ session, token }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.stravaId as string,
          },
        };
      },
    },
  });
}

export async function POST(req: NextRequest) {
  return Auth(req, {
    providers: [strava],
    secret: process.env.AUTH_SECRET,
    callbacks: {
      async jwt({ token, account, profile }) {
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.stravaId = profile?.id;
        }
        return token;
      },
      async session({ session, token }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.stravaId as string,
          },
        };
      },
    },
  });
}
