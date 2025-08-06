import { NextRequest, NextResponse } from "next/server";
import { getUserFriends, addFriend } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get athlete ID from cookies
    const athleteId = request.cookies.get("strava_athlete_id");

    if (!athleteId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's friends
    const friends = await getUserFriends(athleteId.value);

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get athlete ID from cookies
    const athleteId = request.cookies.get("strava_athlete_id");

    if (!athleteId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { friendId, friendName, friendImage } = await request.json();

    if (!friendId || !friendName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add friend
    await addFriend(athleteId.value, friendId, friendName, friendImage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding friend:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
