"use client";
import React, { useEffect, useState } from "react";
import EventHeader from "@/components/event/EventHeader";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import Link from "next/link";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import "../globals.css";
import apiFetch from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/button";

export interface request {
  requestId: number;
  songImage: string;
  songName: string;
  songArtist: string;
  requestUpvotes: number;
  played: boolean;
}

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

const EventOwnershipDisclaimer = ({ djId }: { djId: string }) => {
  const { user } = useUser();
  const isOwner = user?.id === djId;

  return (
    <div className="text-gray-200 dark:text-gray-200 text-sm mt-6">
      {isOwner ? (
        <div>
        <Button className="outline-double" variant={"outline"} onClick={() => {redirect(`/event-admin?eventId=${localStorage.getItem('eventId')}`)}}>
          Admin Dashboard
        </Button>

        </div>
      ) : (
        <p>This event is not owned by you.</p>
      )}
    </div>
  );
};

const Index = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [songRequests, setSongRequests] = useState<request[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventValidated, setEventValidated] = useState(false);
  const [eventData, setEventData] = useState<event | null>(null);
  const [djData, setDjData] = useState<DJ | null>(null);

  useEffect(() => {
    // Disable scrolling on body when component mounts
    document.body.style.overflow = "hidden";

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const eventId = url.searchParams.get("eventId");

    if (!eventId) {
      router.push("/404");
      return;
    }

    // Fetch event details to validate existence
    apiFetch(`/events/getById?eventId=${eventId}`)
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
        const djId = eventData.djId;
        localStorage.setItem("djId", djId);
        setEventData(eventData);
        setEventValidated(true);
      })
      .catch((error) => {
        console.log("Error fetching event details:", error);
        router.push("/404");
      });

    localStorage.setItem("eventId", eventId);
  }, []);

  useEffect(() => {
    if (eventValidated) {
      const url = new URL(window.location.href);
      const eventId = url.searchParams.get("eventId");
      const djId = localStorage.getItem("djId");

      // Fetch DJ information
      apiFetch(`/djs/getById?djId=${djId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data && !data.error) {
            setDjData(data);
          } else {
            console.log(
              "Error fetching DJ data:",
              data?.error || "DJ not found"
            );
          }
        })
        .catch((error) => {
          console.log("Error fetching DJ details:", error);
        });

      // Fetch song requests
      apiFetch(`/requests/getByEvent?eventId=${eventId}`)
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSongRequests(data);
          } else {
            //console.log("Fetched data is not an array:", data);
            setSongRequests([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.log("Error fetching initial requests:", error);
          setLoading(false);
        });
    }
  }, [eventValidated]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden">
      <div className="bg-gray-900 dark:bg-gray-900 flex max-w-[600px] w-full h-screen flex-col overflow-hidden items-center mx-auto">
        <EventHeader
          title={eventData?.eventName || "Default Event Title"}
          imageUrl={eventData?.eventImage}
        />
        

        <div className="flex flex-col items-center w-full px-4 pb-20 overflow-y-auto flex-1">
          <DJProfile
            name={djData?.djName || "DJ Zo"}
            role="Main Event DJ"
            image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
            insta={djData?.djInsta ? (isMobile ? `instagram://user/${djData.djInsta}` : `https://www.instagram.com/${djData.djInsta}`) : ''}
          />
          <div>
            <EventOwnershipDisclaimer djId={eventData?.djId} />
          </div>

          <h2 className="text-gray-200 dark:text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
            Song Queue
          </h2>
          <div className="gap-[13px] w-[100%] pt-5 overflow-y-auto flex-1 scrollbar max-h-[500px]">
            {songRequests
              .filter((request) => !request.played)
              .map((request) => (
                <div className="pb-3 mr-2 " key={request.requestId}>
                  <SongCard
                    key={request.requestId}
                    image={request.songImage}
                    title={request.songName}
                    artist={request.songArtist}
                    reactions={request.requestUpvotes}
                  />
                </div>
              ))}
          </div>
          <div
            className={`flex items-center justify-center w-full h-[50px] bg-transparent ${isMobile ? "mb-[50px]" : ""}`}
          >
            <div className="self-stretch w-full text-base text-white font-bold text-center uppercase tracking-[1px] mt-[25px] px-[52px] bg-transparent">
              <Link href="/request-song">
                <button className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] w-full px-[43px] py-[19px] rounded-[15px]">
                  Request a song
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
