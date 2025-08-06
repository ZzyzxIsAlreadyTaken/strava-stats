import { headers } from "next/headers";
import { cookies } from "next/headers";
import ActivitiesList from "@/components/ActivitiesList";
import FriendsList from "@/components/FriendsList";
import ActivityGraph from "@/components/ActivityGraph";

async function getSession() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token");
    const athleteId = cookieStore.get("strava_athlete_id");

    if (!accessToken || !athleteId) {
      return { user: null };
    }

    // Verify the token is still valid by fetching athlete data
    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      }
    );

    if (!athleteResponse.ok) {
      return { user: null };
    }

    const athlete = await athleteResponse.json();

    return {
      user: {
        id: athlete.id.toString(),
        name: `${athlete.firstname} ${athlete.lastname}`,
        image: athlete.profile,
      },
      accessToken: accessToken.value,
    };
  } catch (error) {
    console.error("Error fetching session:", error);
    return { user: null };
  }
}

async function getStats() {
  try {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get("strava_athlete_id");

    if (!athleteId) {
      return null;
    }

    // Import the database functions directly
    const { getUserActivities } = await import("@/lib/db");
    const { calculateStats, formatDistance, formatTime } = await import(
      "@/lib/strava-api"
    );

    // Get user activities from database
    const activities = await getUserActivities(athleteId.value, 1, 10);
    const allActivities = await getUserActivities(athleteId.value, 1, 10000);

    // Convert database activities to StravaActivity format for stats
    const stravaActivities = allActivities.map((activity) => ({
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

    // Calculate stats
    const stats = calculateStats(stravaActivities);

    // Filter and transform activities to match expected format
    const validActivities = activities
      .filter((activity) => activity.name && activity.startDate)
      .map((activity) => ({
        id: activity.id,
        name: activity.name!,
        startDate: activity.startDate!.toISOString(),
        distance: activity.distance || 0,
        movingTime: activity.movingTime || 0,
      }));

    return {
      stats: {
        totalActivities: stats.totalActivities,
        totalDistance: formatDistance(stats.totalDistance),
        totalTime: formatTime(stats.totalTime),
        averageDistance: formatDistance(stats.averageDistance),
        averageTime: formatTime(stats.averageTime),
      },
      activities: validActivities,
      pagination: {
        page: 1,
        perPage: 10,
        totalActivities: stats.totalActivities,
        totalPages: Math.ceil(stats.totalActivities / 10),
      },
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

async function getFriends() {
  try {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get("strava_athlete_id");

    if (!athleteId) {
      return { friends: [] };
    }

    // Import the database functions directly
    const { getUserFriends } = await import("@/lib/db");

    // Get user's friends
    const friends = await getUserFriends(athleteId.value);

    // Filter out null values and transform to expected format
    const validFriends = friends
      .filter((friend) => friend.friendId && friend.friendName)
      .map((friend) => ({
        id: friend.id,
        friendId: friend.friendId!,
        friendName: friend.friendName!,
        friendImage: friend.friendImage || "",
        createdAt: friend.createdAt?.toISOString() || new Date().toISOString(),
      }));

    return { friends: validFriends };
  } catch (error) {
    console.error("Error fetching friends:", error);
    return { friends: [] };
  }
}

export default async function Home() {
  const session = await getSession();
  const statsData = session?.user ? await getStats() : null;
  const friendsData = session?.user ? await getFriends() : { friends: [] };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Strava Stats
            </h1>
            <p className="text-gray-600 mb-8">
              Compare your running stats with friends
            </p>

            <a
              href="/api/auth/signin/strava"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Connect with Strava
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Strava Stats
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">
                  {session.user?.name}
                </span>
              </div>
              <a
                href="/api/auth/signout"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Time Period
              </h2>
              <div className="space-y-2">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((period) => (
                  <button
                    key={period}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <FriendsList initialFriends={friendsData.friends} />
            </div>

            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sync Data
              </h2>
              <form action="/api/sync" method="POST">
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Sync with Strava
                </button>
              </form>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {statsData?.stats?.totalActivities || 0}
                  </div>
                  <div className="text-sm text-orange-600">Activities</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {statsData?.stats?.totalDistance || "0 km"}
                  </div>
                  <div className="text-sm text-blue-600">Distance</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {statsData?.stats?.totalTime || "0:00"}
                  </div>
                  <div className="text-sm text-green-600">Time</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <ActivitiesList
                  initialActivities={statsData?.activities || []}
                  initialPagination={
                    statsData?.pagination || {
                      page: 1,
                      perPage: 10,
                      totalActivities: 0,
                      totalPages: 0,
                    }
                  }
                />
              </div>
            </div>

            {/* Activity Graph */}
            <ActivityGraph />
          </div>
        </div>
      </main>
    </div>
  );
}
