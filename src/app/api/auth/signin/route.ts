import { redirect } from "next/navigation";

export async function GET() {
  // Redirect to the main auth route with signin action
  return redirect("/api/auth?action=signin&provider=strava");
}
