// db/schema.ts
import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Strava athlete ID
  name: text("name"),
  image: text("image"),
  accessToken: text("access_token"), // 👈 required
  refreshToken: text("refresh_token"), // 👈 required
  expiresAt: integer("expires_at"), // 👈 required (UNIX timestamp from Strava)
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name"),
  type: text("type"), // "Run", "Ride", etc.
  distance: real("distance"), // in meters
  movingTime: integer("moving_time"), // in seconds
  startDate: timestamp("start_date"),
});

export const friends = pgTable("friends", {
  id: text("id").primaryKey(), // Auto-generated UUID
  userId: text("user_id").references(() => users.id), // The user who added the friend
  friendId: text("friend_id"), // The friend's Strava ID (no foreign key constraint)
  friendName: text("friend_name"), // Friend's display name
  friendImage: text("friend_image"), // Friend's profile image
  createdAt: timestamp("created_at").defaultNow(),
});
