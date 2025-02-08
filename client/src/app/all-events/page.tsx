"use client";
import React, { useEffect, useState } from "react";
import EventCard from "@/components/event/EventCard"; // Adjust the import path as necessary
import apiFetch from "../../utils/api"; // Adjust the import path as necessary
import Image from "next/image";
import { Button } from "../../components/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import Loader from "@/components/loader";

const Index = () => {

  const [events, setEvents] = useState<any[]>([]); // Use 'any' or define a proper type for events
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true); // State to manage loading

  useEffect(() => {
    // Fetch all events
    apiFetch("/events/all")
      .then((response) => response.json())
      .then((data) => {
        if (!data || data.error) {
          console.error("Error fetching event data:", data?.error || "No data");
          return;
        }
        setEvents(data);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch((error) => {
        console.error("Error fetching event details:", error);
        setLoading(false); // Set loading to false on error
      });
  }, []);

  // Sort events by date
  const sortedEvents = events.sort((a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime());

  // Filter events based on search query
  const filteredEvents = sortedEvents.filter(event =>
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.eventLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-white flex items-center justify-center">
  
    <div className="relative w-screen bg-gray-900 text-white h-screen">
      <header className="bg-gray-900 dark:bg-gray-900 w-full py-1 flex items-start h-50 fixed top-0 left-0 z-20">
        
        {/* Logo at the top */}
        <div className="flex items-center w-full">
            <div className="absolute left-5 items-center">
                <Button variant='outline' size='icon' className="bg-slate-600 mr-2 h-10" onClick={() => {
                    redirect(`/`)
                }}>
                    <ChevronLeft />
                </Button>
            </div>
          
          <div className="flex-grow flex justify-center"> {/* Center the logo */}
            <Image
              src="/RequestLogoDark.png" // Adjust the path to your logo image
              alt="Logo"
              width={120} // Adjust the width to make it smaller
              height={120} // Adjust the height to make it smaller
              className="object-contain" // Ensures the logo maintains its aspect ratio
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-3 mt-14 fixed top-16 left-0 right-0 z-10 mx-auto" style={{ width: '23rem' }}>
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
            className="w-full bg-transparent outline-none text-sm text-gray-200 ml-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query state
            style={{ fontSize: '16px' }} // Set a base font size to prevent zooming
          />
        </div>
      </header>

      <div className="p-4 mt-16 bg-gray-900 h-screen">
        <div className="h-screen mt-28">
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="flex justify-center items-center h-20 mt-20">
                <Loader2 className="animate-spin"/>
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event.eventId} onClick={() => {
                  localStorage.setItem('eventId', event.eventId);
                  redirect(`/event?eventId=${event.eventId}`);
                }} className="cursor-pointer">
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
                <p className="text-4xl mb-2">😔</p>
                <p className="text-center text-sm">
                  No events found matching your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
};

export default Index;