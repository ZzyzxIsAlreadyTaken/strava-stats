import { redirect } from "next/navigation";
import { Auth } from "@auth/core";
import { strava } from "@/lib/strava-provider";

export async function GET() {
  const authResponse = await Auth(
    new Request("http://localhost:3000/api/auth/signout"),
    {
      providers: [strava],
      secret: process.env.AUTH_SECRET,
    }
  );

  return redirect("/");
}
