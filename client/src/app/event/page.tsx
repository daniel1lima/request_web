'use client'
import React, { useEffect, useState } from "react";
import EventHeader from "@/components/event/EventHeader";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import RequestButton from "@/components/event/RequestButton";
import { NavigateAction } from "next/dist/client/components/router-reducer/router-reducer-types";
import Link from "next/link";

export interface request {
  requestId: number;
  songImage: string;
  songName: string;
  songArtist: string;
  requestUpvotes: number;
  played: boolean;
} 

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
    <div className="loader">Loading...</div>
  </div>
);

const Index = () => {
  const [songRequests, setSongRequests] = useState<request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    const eventId = url.searchParams.get('eventId');

    if (!eventId) {
      console.log('Event ID not found in URL');
      return;
    }

    // Fetch song requests
    fetch(`api/requests/getByEvent?eventId=${eventId}`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSongRequests(data);
        } else {
          console.log("Fetched data is not an array:", data);
          setSongRequests([]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.log("Error fetching initial requests:", error);
        setLoading(false);
      });

    // Fetch event details to get djId
    fetch(`api/events/getById?eventId=${eventId}`)
      .then(response => response.json())
      .then(eventData => {
        const djId = eventData.djId; // Assuming djId is directly available
        localStorage.setItem("djId", djId);
      })
      .catch(error => {
        console.log("Error fetching event details:", error);
      });

    localStorage.setItem("eventId", eventId);

    // // Set up WebSocket connection for real-time updates
    // const socket = new WebSocket(`ws://localhost:65534/requests/webhook/getByEvent?eventId=${eventId}`);

    // socket.onopen = () => {
    //   console.log("WebSocket connection established");
    // };

    // socket.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   console.log(data); // Log the incoming data

    //   if (data.type === "create") {
    //     setSongRequests(data.requests); // Update state with new requests
    //   } else {
    //     console.log("Unexpected data type:", data.type);
    //   }
    // };

    // socket.onerror = (error) => {
    //   console.log("WebSocket error:", error);
    // };

    // socket.onclose = () => {
    //   console.log("WebSocket connection closed");
    // };

    // // Clean up on component unmount
    // return () => {
    //   socket.close();
    // };
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="bg-gray-900 dark:bg-gray-900 flex max-w-[600px] w-full h-screen flex-col overflow-y-auto items-center mx-auto">
      <EventHeader />

      <div className="flex flex-col items-center w-full px-4 pb-20">
        <DJProfile
          name="DJ Zo"
          role="Main Event DJ"
          image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
        />

        <h2 className="text-gray-200 dark:text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
          Song Queue
        </h2>

        <div
          className="bg-gray-900 dark:bg-gray-900 flex flex-col gap-[13px] w-[80%] pt-5"
          style={{ height: `${songRequests.filter(req => !req.played).length * 100}px` }}
        >
          {songRequests.filter(request => !request.played).map((request) => (
            <SongCard
              key={request.requestId}
              image={request.songImage}
              title={request.songName}
              artist={request.songArtist}
              reactions={request.requestUpvotes}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 w-full max-w-[480px] bg-transparent pb-4">
        <div className="self-stretch w-full text-base text-white font-bold text-center uppercase tracking-[1px] mt-[60px] pt-[9px] pb-5 px-[52px] bg-transparent">
          <Link href="/request-song">
            <button className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] w-full px-[43px] py-[19px] rounded-[15px]">
              Request a song
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
