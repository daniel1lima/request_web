"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import "./globals.css";
import EventCard from "@/components/event/EventCard";
import apiFetch from "../utils/api";
import { FaHome, FaMusic, FaMap, FaUser } from "react-icons/fa";
import Link from "next/link";

export interface Event {
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDateTime: string;
  eventLocation: string;
  requestFee: number;
  djId: string;
  createdAt: string;
  updatedAt: string;
}

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
    <div className="loader text-white">
      <Image
        src="/RequestLogoLight.png"
        alt="DJ Request Logo"
        width={200}
        height={200}
        className="invert dark:invert"
        priority
        style={{ objectFit: "contain" }}
      />
    </div>
  </div>
);

const Index = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<Event[] | null>(null);
  const [allEvents, setAllEvents] = useState<Event[] | null>(null); // New state for all events

  useEffect(() => {
    // Fetch all events
    apiFetch("/events/all")
      .then((response) => response.json())
      .then((data) => {
        if (!data || data.error) {
          console.error("Error fetching event data:", data?.error || "No data");
          router.push("/404");
          return;
        }

        setAllEvents(data); // Store all events
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching event details:", error);
        router.push("/404");
      });
  }, [router]);

  if (loading) {
    return <Loader />;
  }

  // Get the current date and time
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Filter for current events
  const currentEvents = allEvents?.filter((event: Event) => {
    const eventDate = new Date(event.eventDateTime);
    return eventDate >= now && eventDate <= next24Hours; // Events happening today or in the next 24 hours
  });

  // Filter for events after 24 hours
  const futureEvents = allEvents?.filter((event: Event) => {
    const eventDate = new Date(event.eventDateTime);
    return eventDate > next24Hours; // Events happening after 24 hours
  });

  // --- Main Page UI ---
  return (
    <div className="relative w-screen h-200 bg-gray-900 text-white overflow-y-auto">
      {/* Top header */}
      <header className="bg-gray-900 dark:bg-gray-900 w-full py-1 px-4 flex justify-center h-14 mb-3">
        {/* Logo in the center */}
        <div className="flex items-center">
          <Image
            src="/RequestLogoDark.png" // Adjust the path to your logo image
            alt="Logo"
            width={120} // Adjust the width to make it smaller
            height={60} // Adjust the height to make it smaller
            className="object-contain" // Ensures the logo maintains its aspect ratio
          />
        </div>
      </header>

      {/* Search bar + Category chips */}
      <div className="px-4 py-3 bg-gray-900">
        {/* Search */}
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 cursor-pointer" onClick={() => window.location.href = '/all-events'}>
          {/* Replace with an icon if you prefer */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            <circle
              cx="10"
              cy="10"
              r="6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent outline-none text-sm text-gray-200 ml-2 cursor-pointer"
            style={{ fontSize: '16px' }} // Set font size to 16px to prevent zooming
            onFocus={() => window.location.href = '/all-events'} // Redirect on focus
          />
        </div>

        {/* Category Chips */}
        <div className="flex space-x-2 mt-3 overflow-x-auto scrollbar-hide whitespace-nowrap">
          {" "}
          {/* Added whitespace-nowrap */}
          <span className="flex items-center justify-center px-3 py-2 rounded-full bg-indigo-600 text-xs text-center">
            Night Clubs
          </span>
          <span className="flex items-center justify-center px-3 py-2 rounded-full bg-orange-600 text-xs text-center">
            Restaurants
          </span>
          <span className="flex items-center justify-center px-3 py-2 rounded-full bg-green-600 text-xs text-center">
            Lounges
          </span>
          <span className="flex items-center justify-center px-3 py-2 rounded-full bg-red-600 text-xs text-center">
            Bars
          </span>
          <span className="flex items-center justify-center px-3 py-2 rounded-full bg-purple-600 text-xs text-center">
            Other
          </span>
        </div>
      </div>

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4">
        {/* Current Events */}
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Events Right Now</h2>
            <Link href="/all-events">
              <button className="text-sm text-indigo-400">
                See All
              </button>
            </Link>
          </div>

          {/* Events grid or list */}
          <div className="mt-4 p-4 bg-white bg-opacity-5 rounded-lg shadow-md h-58 overflow-x-auto whitespace-nowrap ">
            <div className="flex gap-4">
              {currentEvents && currentEvents.length > 0 ? (
                currentEvents.map((event) => {
                  const eventDate = new Date(event.eventDateTime);
                  return (
                    <div
                      key={event.eventId}
                      className="inline-block cursor-pointer hover:bg-gray-700 transition"
                      onClick={() => {
                        redirect(`/event?eventId=${event.eventId}`);
                      }}
                    >
                      <EventCard
                        image={event.eventImage}
                        title={event.eventName}
                        date={new Date(event.eventDateTime).toLocaleDateString()}
                        location={event.eventLocation}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                  <p className="text-5xl mb-2">😔</p>
                  <p className="text-center text-sm">
                    Sorry, Nothing Here Just Yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>


                {/* Invite friends banner */}
                <section className="mt-8">
          <div className="relative bg-indigo-600 rounded-lg p-4 flex items-center">
            <h3 className="text-5xl font-bold">🙋‍♂️</h3>
            <div>
              <h3 className="text-sm font-bold text-center ml-1 mr-3">
                Join our future events!
              </h3>
              <p className="text-sm opacity-90 text-center">
                Get 1 free request
              </p>
            </div>
            <Link href="/waitlist">
              <button className="ml-auto bg-white text-indigo-600 font-semibold py-2 px-4 rounded-md">
                Join Now
              </button>
            </Link>
          </div>
        </section>

        {/* Events After 24 Hours */}
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Events Coming Soon</h2>
            <Link href="/all-events">
              <button className="text-sm text-indigo-400">
                See All
              </button>
            </Link>
          </div>

          {/* Events grid or list */}
          <div className="mt-4 p-4 bg-white bg-opacity-5 rounded-lg shadow-md h-58 overflow-x-auto whitespace-nowrap ">
            <div className="flex gap-4">
              {futureEvents && futureEvents.length > 0 ? (
                futureEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="inline-block cursor-pointer hover:bg-gray-700 transition"
                    onClick={() => {
                      redirect(`/event?eventId=${event.eventId}`);
                    }}
                  >
                    <EventCard
                      image={event.eventImage}
                      title={event.eventName}
                      date={new Date(event.eventDateTime).toLocaleDateString()}
                      location={event.eventLocation}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                  <p className="text-5xl mb-2">😔</p>
                  <p className="text-center text-sm">
                    Sorry, Nothing Here Just Yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 w-full max-w-[600px] mx-auto left-0 right-0 bg-gray-900 border-t border-gray-800 py-2 flex justify-around items-center">
        
        <Link href="/">
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaHome className="h-5 w-5 mb-1" />
          Explore
        </button>
        </Link>

        <Link href="/all-events">
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaMusic className="h-5 w-5 mb-1" />
          Events
        </button>
        </Link>
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaUser className="h-5 w-5 mb-1" />
          User
        </button>
      </nav>
    </div>
  );
};

export default Index;
