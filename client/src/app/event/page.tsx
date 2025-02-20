"use client";
import React, { useEffect, useState } from "react";
import EventHeader from "@/components/event/EventHeader";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "../globals.css";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/button";
import { fetchEventById, fetchDjById, fetchRequestsByEventId } from "@/api/apiService";

// Define interfaces for requests, events, and DJs
export interface Request {
  requestId: number;
  songImage: string;
  songName: string;
  songArtist: string;
  requestUpvotes: number;
  played: boolean;
}

export interface Event {
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDateTime: string;
  eventLocation: string;
  acceptRequests: string;
  acceptFreeRequests: string;
  requestFee: number;
  djId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DJ {
  djId: string;
  djName: string;
  djInsta?: string;
}

// Loader component for loading state
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

// Event ownership disclaimer component
const EventOwnershipDisclaimer = ({ djId }: { djId: string }) => {
  const { user } = useUser();
  const isOwner = user?.id === djId;
  const router = useRouter()

  return (
    <div className="text-gray-200 dark:text-gray-200 text-sm mt-6">
      {isOwner && (
        <Button className="outline-double" variant={"outline"} onClick={() => router.push(`/event-admin?eventId=${localStorage.getItem('eventId')}`)}>
          Admin Dashboard
        </Button>
      )}
    </div>
  );
};

// Main EventPage component
const EventPage = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [djData, setDjData] = useState<DJ | null>(null);
  const [songRequests, setSongRequests] = useState<Request[]>([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
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
    const loadData = async () => {
      const url = new URL(window.location.href);
      const eventId = url.searchParams.get("eventId");

      if (!eventId) {
        return;
      }

      localStorage.setItem("eventId", eventId);

      try {
        const eventData = await fetchEventById(eventId);
        if (!eventData || eventData.error) router.push('/404');

        const djId = eventData.djId;
        localStorage.setItem("djId", djId);
        setEventData(eventData);

        const djData = await fetchDjById(djId);
        if (djData && !djData.error) {
          setDjData(djData);
        }

        const requestsData = await fetchRequestsByEventId(eventId);
        setSongRequests(Array.isArray(requestsData) ? requestsData.filter(request => request.status === 'accepted') : []);
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push('/404')
      } 
    };

    loadData();
  }, [router]);

  if (loading) {
    return <Loader />;
  } else return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden">
      <div className="bg-gray-900 flex max-w-[600px] w-full h-screen flex-col overflow-hidden items-center mx-auto">
        <EventHeader
          title={eventData?.eventName || "Default Event Title"}
          imageUrl={eventData?.eventImage || ''}
        />
        <div className="flex flex-col items-center w-full px-4 pb-20 overflow-y-auto flex-1">
          <DJProfile
            name={djData?.djName || "DJ Zo"}
            role="Main Event DJ"
            image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
            insta={djData?.djInsta ? (isMobile ? `instagram://user/${djData.djInsta}` : `https://www.instagram.com/${djData.djInsta}`) : ''}
          />
          <EventOwnershipDisclaimer djId={eventData?.djId ?? ''} />
          <h2 className="text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
            Song Queue
          </h2>
          <div className="gap-[13px] w-full pt-5 overflow-y-auto flex-1 scrollbar max-h-[500px]">
            {songRequests.filter(request => !request.played).map(request => (
              <div className="pb-3 mr-2" key={request.requestId}>
                <SongCard
                  image={request.songImage}
                  title={request.songName}
                  artist={request.songArtist}
                  reactions={request.requestUpvotes}
                />
              </div>
            ))}
          </div>
          {eventData?.acceptRequests &&
          <div className={`flex items-center justify-center w-full h-[50px] bg-transparent ${isMobile ? "mb-[50px]" : ""}`}>
            <Link href="/request-song">
              <button className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] w-full px-[100px] py-[19px] rounded-[15px]">
                Request a song
              </button>
            </Link>
          </div>
          }
        </div>
      </div>
    </div>
  );
};

export default EventPage;
