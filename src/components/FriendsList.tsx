"use client";

import { useState, useEffect } from "react";

interface Friend {
  id: string;
  friendId: string;
  friendName: string;
  friendImage: string;
  createdAt: string;
}

interface FriendsListProps {
  initialFriends: Friend[];
}

export default function FriendsList({ initialFriends }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [newFriendId, setNewFriendId] = useState("");
  const [newFriendName, setNewFriendName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!newFriendId || !newFriendName) return;

    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          friendId: newFriendId,
          friendName: newFriendName,
          friendImage: "", // You can add image URL later
        }),
      });

      if (response.ok) {
        setNewFriendId("");
        setNewFriendName("");
        setShowAddForm(false);
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/friends/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      });

      if (response.ok) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Friends</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors"
        >
          {showAddForm ? "Cancel" : "Add Friend"}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Friend's Strava ID
              </label>
              <input
                type="text"
                value={newFriendId}
                onChange={(e) => setNewFriendId(e.target.value)}
                placeholder="Enter Strava athlete ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Friend's Name
              </label>
              <input
                type="text"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                placeholder="Enter friend's name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={addFriend}
              disabled={loading || !newFriendId || !newFriendName}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              {loading ? "Adding..." : "Add Friend"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {friend.friendImage && (
                  <img
                    src={friend.friendImage}
                    alt={friend.friendName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {friend.friendName}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {friend.friendId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFriend(friend.friendId)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No friends added yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Add friends to compare stats!
          </p>
        </div>
      )}
    </div>
  );
}
