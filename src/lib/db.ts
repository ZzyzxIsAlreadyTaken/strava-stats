import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, activities, friends } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { calculateStats } from "./strava-api";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema: { users, activities, friends } });

export async function getUserById(userId: string) {
  try {
    console.log("Getting user by ID:", userId);
    const result = await db.select().from(users).where(eq(users.id, userId));
    console.log("User found:", result.length > 0);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

export async function createOrUpdateUser(userData: {
  id: string;
  name: string;
  image: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}) {
  try {
    console.log("Creating/updating user:", userData.id);
    await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: userData.name,
          image: userData.image,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          expiresAt: userData.expiresAt,
        },
      });
    console.log("User created/updated successfully");
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
}

export async function saveActivities(
  userId: string,
  activitiesData: {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    start_date: string;
  }[],
  existingIds?: Set<string>
) {
  try {
    console.log(
      "Processing activities for user:",
      userId,
      "Total count:",
      activitiesData.length
    );

    if (activitiesData.length === 0) return;

    // Filter out activities that already exist
    const newActivities = existingIds
      ? activitiesData.filter(
          (activity) => !existingIds.has(activity.id.toString())
        )
      : activitiesData;

    console.log(
      "New activities to save:",
      newActivities.length,
      "Existing activities skipped:",
      activitiesData.length - newActivities.length
    );

    if (newActivities.length === 0) {
      console.log("No new activities to save");
      return;
    }

    const activitiesToInsert = newActivities.map((activity) => ({
      id: activity.id.toString(),
      userId,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      movingTime: activity.moving_time,
      startDate: new Date(activity.start_date),
    }));

    await db
      .insert(activities)
      .values(activitiesToInsert)
      .onConflictDoNothing();
    console.log("New activities saved successfully");
  } catch (error) {
    console.error("Error saving activities:", error);
    throw error;
  }
}

export async function getUserActivities(
  userId: string,
  page = 1,
  perPage = 10
) {
  try {
    console.log(
      "Getting activities for user:",
      userId,
      "page:",
      page,
      "perPage:",
      perPage
    );
    const offset = (page - 1) * perPage;

    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.startDate))
      .limit(perPage)
      .offset(offset);

    console.log("Activities found:", result.length);
    return result;
  } catch (error) {
    console.error("Error getting user activities:", error);
    throw error;
  }
}

export async function getExistingActivityIds(
  userId: string
): Promise<Set<string>> {
  try {
    console.log("Getting existing activity IDs for user:", userId);
    const result = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.userId, userId));

    const existingIds = new Set(result.map((row) => row.id));
    console.log("Existing activity IDs found:", existingIds.size);
    return existingIds;
  } catch (error) {
    console.error("Error getting existing activity IDs:", error);
    throw error;
  }
}

export async function getMostRecentActivityDate(
  userId: string
): Promise<Date | null> {
  try {
    console.log("Getting most recent activity date for user:", userId);
    const result = await db
      .select({ startDate: activities.startDate })
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(activities.startDate)
      .limit(1);

    if (result.length === 0) {
      console.log("No activities found for user");
      return null;
    }

    const mostRecentDate = result[0].startDate;
    console.log("Most recent activity date:", mostRecentDate);
    return mostRecentDate;
  } catch (error) {
    console.error("Error getting most recent activity date:", error);
    throw error;
  }
}

export async function addFriend(
  userId: string,
  friendId: string,
  friendName: string,
  friendImage: string
) {
  try {
    console.log("Adding friend:", friendId, "for user:", userId);
    await db.insert(friends).values({
      id: crypto.randomUUID(),
      userId,
      friendId,
      friendName,
      friendImage,
    });
    console.log("Friend added successfully");
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
}

export async function removeFriend(userId: string, friendId: string) {
  try {
    console.log("Removing friend:", friendId, "for user:", userId);
    await db
      .delete(friends)
      .where(and(eq(friends.userId, userId), eq(friends.friendId, friendId)));
    console.log("Friend removed successfully");
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
}

export async function getUserFriends(userId: string) {
  try {
    console.log("Getting friends for user:", userId);
    const result = await db
      .select()
      .from(friends)
      .where(eq(friends.userId, userId))
      .orderBy(friends.createdAt);

    console.log("Friends found:", result.length);
    return result;
  } catch (error) {
    console.error("Error getting user friends:", error);
    throw error;
  }
}

export async function getFriendStats(friendId: string) {
  try {
    console.log("Getting stats for friend:", friendId);
    const activities = await getUserActivities(friendId, 1, 10000); // Get all activities for stats

    // If no activities found, return empty stats
    if (activities.length === 0) {
      console.log("No activities found for friend:", friendId);
      return {
        totalActivities: 0,
        totalDistance: 0,
        totalTime: 0,
        averageDistance: 0,
        averageTime: 0,
      };
    }

    // Convert to StravaActivity format for stats calculation
    const stravaActivities = activities.map((activity) => ({
      id: parseInt(activity.id),
      name: activity.name || "",
      type: activity.type || "",
      distance: activity.distance || 0,
      moving_time: activity.movingTime || 0,
      start_date: activity.startDate?.toISOString() || "",
      total_elevation_gain: 0,
      average_speed: 0,
      max_speed: 0,
    }));

    return calculateStats(stravaActivities);
  } catch (error) {
    console.error("Error getting friend stats:", error);
    // Return empty stats on error
    return {
      totalActivities: 0,
      totalDistance: 0,
      totalTime: 0,
      averageDistance: 0,
      averageTime: 0,
    };
  }
}
