import { NextRequest, NextResponse } from "next/server";
import { getUserActivities, getUserFriends } from "@/lib/db";
import { formatDistance, formatTime } from "@/lib/strava-api";

// Define proper types for activities and grouped data
interface Activity {
  id: string;
  name: string | null;
  type: string | null;
  distance: number | null;
  movingTime: number | null;
  startDate: Date | null;
}

interface GroupedActivityData {
  date: string;
  totalDistance: number;
  totalTime: number;
  activityCount: number;
  activities: Activity[];
}

interface FriendData {
  friendId: string;
  friendName: string;
  data: GroupedActivityData[];
}

export async function GET(request: NextRequest) {
  try {
    // Get athlete ID from cookies
    const athleteId = request.cookies.get("strava_athlete_id");

    if (!athleteId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month"; // week, month, year
    const includeFriends = searchParams.get("includeFriends") === "true";

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user activities
    const userActivities = await getUserActivities(athleteId.value, 1, 10000);
    const filteredUserActivities = userActivities.filter(
      (activity) =>
        activity.startDate &&
        new Date(activity.startDate) >= startDate &&
        activity.type === "Run"
    );

    // Group activities by date based on period
    const userData = groupActivitiesByPeriod(filteredUserActivities, period);

    const friendsData: FriendData[] = [];

    if (includeFriends) {
      // Get user's friends
      const friends = await getUserFriends(athleteId.value);

      // Get activities for each friend
      for (const friend of friends) {
        if (!friend.friendId) continue;
        const friendActivities = await getUserActivities(
          friend.friendId,
          1,
          10000
        );
        const filteredFriendActivities = friendActivities.filter(
          (activity) =>
            activity.startDate &&
            new Date(activity.startDate) >= startDate &&
            activity.type === "Run"
        );

        if (filteredFriendActivities.length > 0) {
          const friendData = groupActivitiesByPeriod(
            filteredFriendActivities,
            period
          );
          friendsData.push({
            friendId: friend.friendId || "",
            friendName: friend.friendName || "",
            data: friendData,
          });
        }
      }
    }

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      userData,
      friendsData,
    });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function groupActivitiesByPeriod(
  activities: Activity[],
  period: string
): GroupedActivityData[] {
  const grouped: { [key: string]: GroupedActivityData } = {};

  activities.forEach((activity) => {
    if (!activity.startDate) return;

    const activityDate = new Date(activity.startDate);
    let groupKey: string;

    switch (period) {
      case "week":
        // Group by day
        groupKey = activityDate.toISOString().split("T")[0];
        break;
      case "month":
        // Group by day
        groupKey = activityDate.toISOString().split("T")[0];
        break;
      case "year":
        // Group by month (YYYY-MM format)
        groupKey = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, "0")}`;
        break;
      default:
        groupKey = activityDate.toISOString().split("T")[0];
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        date: groupKey,
        totalDistance: 0,
        totalTime: 0,
        activityCount: 0,
        activities: [],
      };
    }

    grouped[groupKey].totalDistance += activity.distance || 0;
    grouped[groupKey].totalTime += activity.movingTime || 0;
    grouped[groupKey].activityCount += 1;
    grouped[groupKey].activities.push(activity);
  });

  // Convert to array and sort by date
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}
