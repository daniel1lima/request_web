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
import {
  fetchDjById,
  fetchRequestsByEventId,
} from "@/api/apiService";
import Loader from "@/components/loader";
import useEventStore from "@/store/eventStore";
import useDjStore from "@/store/djStore";

// Define interfaces for requests, events, and DJs
// Update the Request interface to match the API response
export interface Request {
  requestId: string;  // Changed from number to string
  songName: string;
  songArtist: string;
  songImage: string;
  accepted: boolean;  // Added
  played: boolean;
  requestUpvotes: number;
  userId: string | null;  // Added
  eventId: string;  // Added
  paymentId: string;  // Added
  status: string;
  createdAt: string;  // Added
  updatedAt: string;  // Added
  User: null | any;  // Added
  Event: {  // Added
    eventName: string;
  };
  Payment: {  // Added
    amount: number;
  };
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



// Event ownership disclaimer component
const EventOwnershipDisclaimer = ({ djId }: { djId: string }) => {
  const { user } = useUser();
  const isOwner = user?.id === djId;
  const router = useRouter();

  return (
    <div className="text-gray-200 dark:text-gray-200 text-sm mt-6">
      {isOwner && (
        <Button
          className="outline-double"
          variant={"outline"}
          onClick={() =>
            router.push(
              `/event-admin?eventId=${localStorage.getItem("eventId")}`
            )
          }
        >
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
  const [refreshing, setRefreshing] = useState(false);
  const [songRequests, setSongRequests] = useState<Request[]>([]);
  const { user } = useUser();
  
  // Use the event store
  const { currentEvent, isLoading, fetchEvent } = useEventStore();
  
  // Use the DJ store
  const { currentDj, fetchDj } = useDjStore();

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

  const loadData = async () => {
    const url = new URL(window.location.href);
    const eventId = url.searchParams.get("eventId") || localStorage.getItem("eventId");

    if (!eventId) {
      return;
    }

    localStorage.setItem("eventId", eventId);

    try {
      // Get the current state from the event store
      const storeState = useEventStore.getState();
      
      // Only fetch event if it's not already in the store or if it's a different event
      if (!storeState.currentEvent || storeState.currentEvent.eventId !== eventId) {
        await fetchEvent(eventId);
      }
      
      // Get the updated state after potential fetch
      const currentEventFromStore = useEventStore.getState().currentEvent;
      
      
      if (!currentEventFromStore) {
        router.push("/404");
        return;
      }

      // Get DJ data using the DJ store
      const djId = currentEventFromStore.djId;
      localStorage.setItem("djId", djId);
      
      // Get the current DJ from the store directly
      const djStoreState = useDjStore.getState();
      
      // Only fetch DJ if not in store or if it's a different DJ
      if (!djStoreState.currentDj || djStoreState.currentDj.djId !== djId) {
        await fetchDj(djId);
      }

      // Only fetch requests if we need to refresh them
      if (refreshing || songRequests.length === 0) {
        const requestsData = await fetchRequestsByEventId(eventId);
        setSongRequests(
          Array.isArray(requestsData)
            ? requestsData.filter((request) => request.status === "accepted")
            : []
        );
      }
      
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRefreshing(false);
      router.push("/404");
    }
  };

  useEffect(() => {
    loadData();
    // Only run when router changes, not on every render
  }, [router]);

  // Only set up the refresh interval once when the component mounts
  useEffect(() => {
    if (!isLoading) {
      const refreshInterval = setInterval(() => {
        setRefreshing(true);
        // Only refresh the requests, not everything
        const refreshRequests = async () => {
          try {
            const eventId = localStorage.getItem("eventId");
            if (eventId) {
              const requestsData = await fetchRequestsByEventId(eventId);
              setSongRequests(
                Array.isArray(requestsData)
                  ? requestsData.filter((request) => request.status === "accepted")
                  : []
              );
            }
            setRefreshing(false);
          } catch (error) {
            console.error("Error refreshing requests:", error);
            setRefreshing(false);
          }
        };
        refreshRequests();
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
    // Only run once when isLoading changes to false
  }, [isLoading]);

  if (isLoading) {
    return <Loader />;
  } else
    return (
      <div className="w-screen h-screen bg-gray-900 overflow-hidden">
        <div className="bg-gray-900 flex max-w-[600px] w-full h-screen flex-col overflow-hidden items-center mx-auto gap-2">
          <EventHeader
            title={currentEvent?.eventName || "Default Event Title"}
            imageUrl={currentEvent?.eventImage || ""}
            djData={currentDj || { djId: "", djName: "", djImageUrl: "" }}
          />

          {refreshing && (
            <div className="absolute top-2 right-2 text-xs text-gray-400">
              Updating...
            </div>
          )}
          
          <DJProfile
            name={currentDj?.djName || "DJ Zo"}
            role="Main Event DJ"
            image={currentDj?.djImageUrl || ""}
            insta={
              currentDj?.djInsta
                ? `https://www.instagram.com/${currentDj.djInsta}`
                : ""
            }
          />

          <div className="flex flex-col items-center w-full px-4 pb-20 mt-[-20] overflow-y-auto flex-1">
            {currentDj?.djId && user?.id === currentDj.djId && (
              <EventOwnershipDisclaimer djId={currentDj.djId} />
            )}
            <h2 className="text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
              Accepted Song Queue
            </h2>
            <div className="gap-[13px] w-full pt-5 mb-6 overflow-y-auto flex-1 scrollbar max-h-[500px]">
              {songRequests
                .filter((request) => !request.played)
                .map((request) => (
                  <div className="pb-3 mr-2" key={request.requestId}>
                    <SongCard
                      image={request.songImage}
                      title={request.songName}
                      artist={request.songArtist}
                      reactions={request.requestUpvotes}
                      payment={request.Payment}
                      isAdminView={false}
                    />
                  </div>
                ))}
            </div>
            {currentEvent?.acceptRequests ? (
              <div
                className={`flex items-center justify-center w-full h-[50px] bg-transparent ${isMobile ? "mb-[30px]" : ""}`}
              >
                <Link href="/request-song">
                  <button className="font-bold bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] w-full px-[100px] py-[19px] rounded-[15px]">
                    Request a song
                  </button>
                </Link>
              </div>
            ) : (
              <div
                className={`flex items-center justify-center w-full h-[40px]  bg-transparent ${isMobile ? "mb-[20px]" : ""}`}
              >
                <button className="bg-black/40 dark:bg-black/40 text-white shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] 
                  w-[90%]
                  h-12  
                  px-[15px]  
                  py-[8px]  
                  rounded-[15px] 
                  text-xs">
                  <strong>Requests are currently disabled</strong>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default EventPage;
