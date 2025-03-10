"use client";
import { useEffect, useState } from "react";
import useRequestStore from "@/store/requestStore";

const EventStats = () => {
  const { requests: songRequests } = useRequestStore();
  const [stats, setStats] = useState({
    totalRequests: 0,
    playedRequests: 0,
    earnings: 0,
  });

  useEffect(() => {
    setStats({
      totalRequests: songRequests.length,
      playedRequests: songRequests.filter(req => req.played).length,
      earnings: songRequests
        .filter(req => req.played)
        .reduce((total, req) => total + (req.Payment?.amount || 0), 0) / 100,
    });
  }, [songRequests]);

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* Songs Requested Card */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            Songs Requested
          </h3>
        </div>
        <p className="text-4xl font-semibold text-white">
          {stats.totalRequests}
        </p>
      </div>

      {/* Songs Played Card */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Songs Played</h3>
        </div>
        <p className="text-4xl font-semibold text-white">
          {stats.playedRequests}
        </p>
      </div>

      {/* DJ Earnings Card */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">DJ Earnings</h3>
        </div>
        <p className="text-4xl font-semibold text-white">
          ${stats.earnings.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default EventStats; 