"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import "./globals.css";
import EventCard from "@/components/event/EventCard";
import apiFetch from '../utils/api'; // Import the apiFetch function

export interface event {
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
  const [eventData, setEventData] = useState<[event] | null>(null);

  useEffect(() => {
    console.log('Fetching event data...'); // Log when fetching starts

    // Fetch event details to validate existence
    apiFetch('/events/all') // Use the apiFetch function
      .then((response) => response.json())
      .then((eventData) => {
        if (!eventData || eventData.error) {
          console.error(
            "Error fetching event data:",
            eventData?.error || "Event not found"
          );
          router.push("/404");
          return;
        }

        setEventData(eventData);
        setEventValidated(true);
      })
      .catch((error) => {
        console.log("Error fetching event details:", error);
        router.push("/404");
      });

  }, []);

  useEffect(() => {
    if (eventValidated) {
      setLoading(false);
    }
  }, [eventValidated]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="w-screen h-screen bg-gray-900">
      <div className="bg-gray-900 dark:bg-gray-900 flex max-w-[600px] w-full min-h-screen flex-col overflow-y-auto items-center mx-auto">

        <div className="flex flex-col items-center w-full px-4 pb-20 max-h-fit">
          {/* <DJProfile
            name={djData?.djName || "DJ Zo"}
            role="Main Event DJ"
            image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
          /> */}

          <h2 className="text-gray-200 dark:text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
            Events
          </h2>
          <div className="gap-[13px] w-[100%] pt-5 overflow-y-auto max-h-[500px] scrollbar">
            {eventData?.map((event) => (
                <div className="pb-3 mr-2 cursor-pointer " key={event.eventId} onClick={() => {redirect(`/event?eventId=${event.eventId}`)}}>
                  <EventCard
                    key={event.eventId}
                    image={event.eventImage}
                    title={event.eventName}
                    fee={event.requestFee}
                  />
                </div>
              ))}
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default Index;
