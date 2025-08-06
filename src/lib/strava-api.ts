interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
}

interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
}

export async function getStravaActivities(
  accessToken: string,
  afterDate?: Date
): Promise<StravaActivity[]> {
  try {
    const allActivities: StravaActivity[] = [];
    let page = 1;
    const perPage = 200; // Strava's max per page

    // Build the URL with optional after parameter
    let url = `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`;
    if (afterDate) {
      const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
      url += `&after=${afterTimestamp}`;
      console.log(
        `Fetching activities after ${afterDate.toISOString()} (timestamp: ${afterTimestamp})`
      );
    } else {
      console.log("Fetching all activities from Strava");
    }

    while (true) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const activities = await response.json();

      // If no more activities, break
      if (activities.length === 0) {
        break;
      }

      allActivities.push(...activities);
      page++;

      // Update URL for next page
      url = `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`;
      if (afterDate) {
        const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
        url += `&after=${afterTimestamp}`;
      }

      // Prevent infinite loop (safety measure)
      if (page > 50) {
        console.log("Reached page limit, stopping to prevent infinite loop");
        break;
      }
    }

    console.log(
      `Fetched ${allActivities.length} activities from Strava${afterDate ? " (after specified date)" : ""}`
    );
    return allActivities;
  } catch (error) {
    console.error("Error fetching Strava activities:", error);
    return [];
  }
}

export async function getStravaAthlete(
  accessToken: string
): Promise<StravaAthlete | null> {
  try {
    const response = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch athlete: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Strava athlete:", error);
    return null;
  }
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:00`;
  }
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function calculateStats(activities: StravaActivity[]) {
  const runningActivities = activities.filter(
    (activity) => activity.type === "Run"
  );

  const totalDistance = runningActivities.reduce(
    (sum, activity) => sum + activity.distance,
    0
  );
  const totalTime = runningActivities.reduce(
    (sum, activity) => sum + activity.moving_time,
    0
  );
  const totalActivities = runningActivities.length;

  return {
    totalDistance,
    totalTime,
    totalActivities,
    averageDistance: totalActivities > 0 ? totalDistance / totalActivities : 0,
    averageTime: totalActivities > 0 ? totalTime / totalActivities : 0,
  };
}
