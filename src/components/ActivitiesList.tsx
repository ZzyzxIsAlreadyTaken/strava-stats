"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  name: string;
  startDate: string;
  distance: number;
  movingTime: number;
}

interface Pagination {
  page: number;
  perPage: number;
  totalActivities: number;
  totalPages: number;
}

interface ActivitiesListProps {
  initialActivities: Activity[];
  initialPagination: Pagination;
}

export default function ActivitiesList({
  initialActivities,
  initialPagination,
}: ActivitiesListProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stats?page=${page}&perPage=10`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      fetchActivities(newPage);
    }
  };

  return (
    <div>
      <h3 className="text-md font-semibold text-gray-900 mb-4">
        Recent Activities
      </h3>

      {loading ? (
        <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : activities && activities.length > 0 ? (
        <div>
          <div className="space-y-3 mb-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {activity.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {(activity.distance / 1000).toFixed(1)} km
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.floor(activity.movingTime / 60)}:
                    {String(activity.movingTime % 60).padStart(2, "0")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pagination.perPage + 1} to{" "}
                {Math.min(
                  currentPage * pagination.perPage,
                  pagination.totalActivities
                )}{" "}
                of {pagination.totalActivities} activities
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">
            No activities found. Sync with Strava to get started!
          </p>
        </div>
      )}
    </div>
  );
}
