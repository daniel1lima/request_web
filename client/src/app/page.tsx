"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import "./globals.css";
import EventCard from "@/components/event/EventCard";
import apiFetch from "../utils/api";
import { FaHome, FaMusic, FaMap, FaUser } from 'react-icons/fa';
import Link from 'next/link';

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
  const [eventValidated, setEventValidated] = useState(false);
  const [eventData, setEventData] = useState<Event[] | null>(null);

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

        // Get the current date and time
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        // Filter events to include only those happening today or in the next 24 hours
        const filteredEvents = data.filter((event: Event) => {
          const eventDate = new Date(event.eventDateTime);
          return eventDate >= now && eventDate <= next24Hours;
        });

        setEventData(filteredEvents);
        setEventValidated(true);
      })
      .catch((error) => {
        console.error("Error fetching event details:", error);
        router.push("/404");
      });
  }, [router]);

  useEffect(() => {
    if (eventValidated) {
      setLoading(false);
    }
  }, [eventValidated]);

  if (loading) {
    return <Loader />;
  }

  // --- Main Page UI ---
  return (
    <div className="relative w-screen h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top header */}
      <header className="bg-gray-900 dark:bg-gray-900 w-full py-2 px-4 border-b border-gray-800 flex justify-center">
        {/* Logo in the center */}
        <div className="flex items-center">
          <Image
            src="/RequestLogoDark.png" // Adjust the path to your logo image
            alt="Logo"
            width={100} // Adjust the width to make it smaller
            height={40} // Adjust the height to make it smaller
            className="object-contain" // Ensures the logo maintains its aspect ratio
          />
        </div>
      </header>

      {/* Search bar + Category chips */}
      <div className="px-4 py-3 bg-gray-900">
        {/* Search */}
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
          {/* Replace with an icon if you prefer */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="10" r="6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent outline-none text-sm text-gray-200 ml-2"
          />
        </div>
      </div>


      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4">
        {/* Upcoming Events */}
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Events</h2>
            <button className="text-sm text-indigo-400" onClick={() => alert("See All")}>
              See All
            </button>
          </div>

          {/* Events grid or list */}
          <div className="mt-4 grid grid-cols-1 gap-4">
            {eventData?.map((event) => (
              <div
                key={event.eventId}
                className="rounded-lg bg-gray-800 overflow-hidden cursor-pointer hover:bg-gray-700 transition"
                onClick={() => {
                  redirect(`/event?eventId=${event.eventId}`);
                }}
              >
                <EventCard
                  image={event.eventImage}
                  title={event.eventName}
                  fee={event.requestFee}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Events After 24 Hours */}
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Events Soon</h2>
            <button className="text-sm text-indigo-400" onClick={() => alert("See All")}>
              See All
            </button>
          </div>

          {/* Events grid or list */}
          <div className="mt-4 grid grid-cols-1 gap-4">
            {eventData?.filter((event) => {
              const eventDate = new Date(event.eventDateTime);
              const now = new Date();
              const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              return eventDate > next24Hours; // Filter for events after 24 hours
            }).map((event) => (
              <div
                key={event.eventId}
                className="rounded-lg bg-gray-800 overflow-hidden cursor-pointer hover:bg-gray-700 transition"
                onClick={() => {
                  redirect(`/event?eventId=${event.eventId}`);
                }}
              >
                <EventCard
                  image={event.eventImage}
                  title={event.eventName}
                  fee={event.requestFee}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Invite friends banner */}
        <section className="mt-8">
          <div className="relative bg-indigo-600 rounded-lg p-4 flex items-center">
            <h3 className="text-5xl font-bold">🙋‍♂️</h3>
            <div>
              <h3 className="text-sm font-bold text-center ml-1 mr-3">Join our future events!</h3>
              <p className="text-sm opacity-90 text-center">Get 1 free request</p>
            </div>
            <Link href="/waitlist">
              <button className="ml-auto bg-white text-indigo-600 font-semibold py-2 px-4 rounded-md">
                Join Now
              </button>
            </Link>
          </div>
        </section>

        {/* Nearby You (if desired) */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nearby You</h2>
            <button className="text-sm text-indigo-400" onClick={() => alert("See All")}>
              See All
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            {/* Add your "Nearby" events or placeholders here */}
            No nearby events found (yet)!
          </div>
        </section>
        
      </main>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 w-full max-w-[600px] mx-auto left-0 right-0 bg-gray-900 border-t border-gray-800 py-2 flex justify-around items-center">
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaHome className="h-5 w-5 mb-1" />
          Explore
        </button>
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaMusic className="h-5 w-5 mb-1" />
          Events
        </button>
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaMap className="h-5 w-5 mb-1" />
          Map
        </button>
        <button className="flex flex-col items-center text-xs text-gray-400">
          <FaUser className="h-5 w-5 mb-1" />
          Profile
        </button>
      </nav>
    </div>
  );
};

export default Index;
