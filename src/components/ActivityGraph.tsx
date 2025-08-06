"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number;
  movingTime: number;
  startDate: string;
}

interface ActivityData {
  date: string;
  totalDistance: number;
  totalTime: number;
  activityCount: number;
  activities: Activity[];
}

interface GraphData {
  period: string;
  startDate: string;
  userData: ActivityData[];
  friendsData: {
    friendId: string;
    friendName: string;
    data: ActivityData[];
  }[];
}

interface ActivityGraphProps {
  initialData?: GraphData;
}

export default function ActivityGraph({ initialData }: ActivityGraphProps) {
  const [data, setData] = useState<GraphData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [period, setPeriod] = useState("month");
  const [includeFriends, setIncludeFriends] = useState(true);
  const [graphType, setGraphType] = useState<"distance" | "time" | "count">(
    "distance"
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/graphs?period=${period}&includeFriends=${includeFriends}`
      );
      if (response.ok) {
        const graphData = await response.json();
        setData(graphData);
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
    } finally {
      setLoading(false);
    }
  }, [period, includeFriends]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.userData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">
            No activity data available for the selected period.
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const labels = data.userData.map((item) => {
    if (period === "year") {
      // For year view, item.date is in YYYY-MM format
      const [year, month] = item.date.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "short" });
    } else {
      // For week/month view, item.date is in YYYY-MM-DD format
      const date = new Date(item.date);
      switch (period) {
        case "week":
          return date.toLocaleDateString("en-US", { weekday: "short" });
        case "month":
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        default:
          return date.toLocaleDateString("nb-NO", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
      }
    }
  });

  const datasets = [
    {
      label: "You",
      data: data.userData.map((item) => {
        switch (graphType) {
          case "distance":
            return item.totalDistance / 1000; // Convert to km
          case "time":
            return item.totalTime / 60; // Convert to minutes
          case "count":
            return item.activityCount;
          default:
            return item.totalDistance / 1000;
        }
      }),
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.1,
    },
  ];

  // Add friend datasets
  data.friendsData.forEach((friend, index) => {
    const colors = [
      "rgb(239, 68, 68)", // red
      "rgb(34, 197, 94)", // green
      "rgb(168, 85, 247)", // purple
      "rgb(245, 158, 11)", // orange
      "rgb(236, 72, 153)", // pink
    ];

    const color = colors[index % colors.length];

    datasets.push({
      label: friend.friendName,
      data: friend.data.map((item) => {
        switch (graphType) {
          case "distance":
            return item.totalDistance / 1000; // Convert to km
          case "time":
            return item.totalTime / 60; // Convert to minutes
          case "count":
            return item.activityCount;
          default:
            return item.totalDistance / 1000;
        }
      }),
      borderColor: color,
      backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.1)"),
      tension: 0.1,
    });
  });

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: getChartTitle(),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: getYAxisLabel(),
        },
      },
    },
  };

  function getChartTitle() {
    const periodText = period.charAt(0).toUpperCase() + period.slice(1);
    const metricText =
      graphType === "distance"
        ? "Distance"
        : graphType === "time"
          ? "Time"
          : "Activity Count";
    return `Running ${metricText} Over ${periodText}`;
  }

  function getYAxisLabel() {
    switch (graphType) {
      case "distance":
        return "Distance (km)";
      case "time":
        return "Time (minutes)";
      case "count":
        return "Number of Activities";
      default:
        return "Distance (km)";
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Running Trends</h2>

        <div className="flex items-center gap-4">
          {/* Time Period Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          {/* Graph Type Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Metric:</label>
            <select
              value={graphType}
              onChange={(e) =>
                setGraphType(e.target.value as "distance" | "time" | "count")
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="distance">Distance</option>
              <option value="time">Time</option>
              <option value="count">Activity Count</option>
            </select>
          </div>

          {/* Friends Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Include Friends:
            </label>
            <input
              type="checkbox"
              checked={includeFriends}
              onChange={(e) => setIncludeFriends(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {data.userData.reduce((sum, item) => sum + item.totalDistance, 0) /
              1000}{" "}
            km
          </div>
          <div className="text-sm text-blue-600">Total Distance</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(
              data.userData.reduce((sum, item) => sum + item.totalTime, 0) / 60
            )}{" "}
            min
          </div>
          <div className="text-sm text-green-600">Total Time</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {data.userData.reduce((sum, item) => sum + item.activityCount, 0)}
          </div>
          <div className="text-sm text-orange-600">Total Activities</div>
        </div>
      </div>
    </div>
  );
}
