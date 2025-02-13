"use client";
import React, { useEffect, useState } from "react";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import apiFetch from "@/utils/api";
import { useUser } from "@clerk/nextjs";

export interface request {
  requestId: string;
  songImage: string;
  songName: string;
  songArtist: string;
  requestUpvotes: number;
  accepted: boolean;
  paymentId?: string;
  played: boolean;
}

export interface DJ {
  djId: string;
  djName: string;
  djEmail: string;
  djPhone: string;
  djInsta: string;
  createdAt: string;
  updatedAt: string;
  Events: Array<{
    eventId: string;
    eventName: string;
    eventImage: string;
    eventDateTime: string;
    eventLocation: string;
    requestFee: number;
    djId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  Payments: Array<{
    paymentId: string;
    amount: number;
    paymentDate: string;
    status: string;
    djId: string;
  }>;
}

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
    <Loader2 className="w-6 h-6 text-white animate-spin" />
  </div>
);

// Helper function to validate API response
const validateResponse = (response: any) => {
  if ("ok" in response && !response.ok) {
    throw new Error("Network response was not ok");
  }
  if ("success" in response && !response.success) {
    throw new Error("Request failed");
  }
  return response.json();
};

const validateResponseNoReturn = (response: any) => {
  if ("ok" in response && !response.ok) {
    throw new Error("Network response was not ok");
  }
  if ("success" in response && !response.success) {
    throw new Error("Request failed");
  }
  return;
};

const EventAdminPage = () => {
  const { user } = useUser();
  const [songRequests, setSongRequests] = useState<request[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("Loading event...");
  const [eventImage, setEventImage] = useState("");
  const [requestFee, setRequestFee] = useState(0);
  const [djData, setDjData] = useState<DJ | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const [noRequests, setNoRequests] = useState(false);

  const isMobile = window.innerWidth <= 768; // Check if the device is mobile

  useEffect(() => {
    const eventId = new URL(window.location.href).searchParams.get("eventId");
    if (!eventId || !user) return;

    localStorage.setItem("eventId", eventId);
    setLoading(true);

    const fetchEventData = apiFetch(`/events/getById?eventId=${eventId}`).then(
      validateResponse
    );

    const fetchSongRequests = apiFetch(
      `/requests/getByEvent?eventId=${eventId}`
    )
      .then(validateResponse)
      .catch(() => []);

    const djId = localStorage.getItem("djId");
    const fetchDJData = djId
      ? apiFetch(`/djs/getById?djId=${djId}`).then(validateResponse)
      : Promise.resolve(null);

    Promise.all([fetchEventData, fetchSongRequests, fetchDJData])
      .then(([eventData, songRequestsData, djData]) => {
        if (user?.id !== djData?.djId) {
          window.location.href = `/event?eventId=${eventId}`;
          return;
        }
        setIsAuthorized(true);
        setEventTitle(eventData.eventName || "Event");
        setEventImage(eventData.eventImage || "");
        setRequestFee(eventData.requestFee || 0);
        setSongRequests(
          Array.isArray(songRequestsData) ? songRequestsData : []
        );
        setDjData(djData && !djData.error ? djData : null);

        setNoRequests(songRequestsData.length === 0);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const acceptRequest = async (requestId: string) => {
    try {
      await apiFetch(`/requests/accept?requestId=${requestId}`, {
        method: "PUT",
      }).then(validateResponse);

      setSongRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.requestId === requestId ? { ...req, accepted: true } : req
        )
      );
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const playedRequest = async (requestId: string) => {
    setLoadingStates((prev) => ({ ...prev, [requestId]: true }));

    try {
      const request = songRequests.find((req) => req.requestId === requestId);
      if (!request?.paymentId) return;

      const paymentData = await apiFetch(`/payment/${request.paymentId}`).then(
        validateResponse
      );

      await apiFetch(
        `/stripe/capturePaymentIntent?intentId=${request.paymentId}&capture=${paymentData.amount}`,
        { method: "POST" }
      ).then(validateResponse);

      await apiFetch(`/requests/played?requestId=${requestId}`, {
        method: "PUT",
      }).then(validateResponse);

      setSongRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.requestId === requestId ? { ...req, played: true } : req
        )
      );
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const declineRequest = async (requestId: string) => {
    setLoadingStates((prev) => ({ ...prev, [requestId]: true }));

    // Immediately update UI
    setSongRequests((prevRequests) =>
      prevRequests.filter((req) => req.requestId !== requestId)
    );

    try {
      const request = songRequests.find((req) => req.requestId === requestId);
      if (!request?.paymentId) return;

      // Handle API calls in the background
      await Promise.all([
        apiFetch(`/stripe/cancelPaymentIntent?intentId=${request.paymentId}`, {
          method: "POST",
        }).then(validateResponseNoReturn),
        apiFetch(`/requests/delete?requestId=${requestId}`, {
          method: "DELETE",
        }).then(validateResponseNoReturn),
      ]);
    } catch (error) {
      console.error("Error cancelling payment:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading || !isAuthorized) return <Loader />;

  return (
    <div
      className={`bg-gray-900 dark:bg-gray-900 ${
        songRequests.filter((req) => req.accepted && !req.played).length ===
          0 &&
        songRequests.filter((req) => !req.accepted && !req.played).length === 0
          ? "h-screen"
          : "h-full"
      }`}
    >
      {/* Updated Header Section with increased height */}
      <div
        className="relative bg-cover bg-center h-48"
        style={{
          backgroundImage: `url(${eventImage})`,
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-8 h-full">
          {/* Content container with flex layout */}
          <div className="flex items-center h-full space-x-8">
            {/* Logo - increased height */}
            <Image
              src="/RequestLogoDark.png"
              alt="Logo"
              width={225}
              height={225}
              priority
            />

            {/* Title content */}
            <div>
              <h1 className="text-6xl font-bold text-white mb-2">
                {eventTitle}
              </h1>
              <p className="text-2xl text-gray-200">DJ Dashboard</p>
            </div>

            {/* DJ Profile moved to header with transparent grey card, aligned to the absolute right */}
            <div className="absolute right-0 bg-opacity-90 rounded-lg flex items-center justify-center pr-8">
              <DJProfile
                name={djData?.djName || "DJ Zo"}
                role="Main Event DJ"
                image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
                insta={
                  djData?.djInsta
                    ? isMobile
                      ? `instagram://user/${djData.djInsta}`
                      : `https://www.instagram.com/${djData.djInsta}`
                    : ""
                }
              />
            </div>
          </div>
        </div>
      </div>
      {noRequests ? (
        <div className="flex items-center justify-center h-[80vh] mb-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold">No requests yet</h2>
            <p className="text-2xl text-gray-500">
              Check back later for song requests
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          {/* Statistics Cards Section */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Songs Requested Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Songs Requested
                </h3>
              </div>
              <p className="text-4xl font-semibold text-white">
                {songRequests.length}
              </p>
            </div>

            {/* Songs Played Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Songs Played</h3>
              </div>
              <p className="text-4xl font-semibold text-white">
                {songRequests.filter((req) => req.played).length}
              </p>
            </div>

            {/* DJ Earnings Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">DJ Earnings</h3>
              </div>
              <p className="text-4xl font-semibold text-white">
                $
                {(songRequests.filter((req) => req.played).length *
                  requestFee) /
                  100}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-full">
            {/* Accepted Songs Column */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
                Accepted Requests
              </h2>
              <div className="space-y-4">
                {songRequests
                  .filter((req) => req.accepted && !req.played)
                  .map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-gray-700 rounded-lg p-4 transition-all hover:shadow-lg relative group"
                    >
                      <div className="flex items-center space-x-4">
                        <SongCard
                          image={request.songImage}
                          title={request.songName}
                          artist={request.songArtist}
                          reactions={request.requestUpvotes}
                        />
                        <button
                          onClick={() => playedRequest(request.requestId)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-600 group-hover:bg-green-500 hover:!bg-green-600 p-3 rounded-full transition-colors"
                          disabled={loadingStates[request.requestId]}
                        >
                          {loadingStates[request.requestId] ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <FaCheck className="w-6 h-6 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Requested Songs Column */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl  overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
                New Requests
              </h2>
              <div className="space-y-4">
                {songRequests
                  .filter((req) => !req.accepted && !req.played)
                  .map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-gray-700 rounded-lg p-4 transition-all hover:shadow-lg relative group "
                    >
                      <div className="flex items-center space-x-4 w-[300px] max-w-[300px]">
                        <SongCard
                          image={request.songImage}
                          title={request.songName}
                          artist={request.songArtist}
                          reactions={request.requestUpvotes}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-3">
                          <button
                            onClick={() => acceptRequest(request.requestId)}
                            className="bg-gray-600 group-hover:bg-green-500 hover:!bg-green-600 p-3 rounded-full transition-colors"
                          >
                            <FaCheck className="w-6 h-6 text-white" />
                          </button>
                          <button
                            onClick={() => declineRequest(request.requestId)}
                            className="bg-gray-600 group-hover:bg-red-500 hover:!bg-red-600 p-3 rounded-full transition-colors"
                            disabled={loadingStates[request.requestId]}
                          >
                            {loadingStates[request.requestId] ? (
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                              <FaTimes className="w-6 h-6 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAdminPage;
