"use client";
import React, { useEffect, useState } from "react";
import EventHeader from "@/components/event/EventHeader";
import DJProfile from "@/components/event/DJprofile";
import AcceptedSongQueue from "@/components/event/AcceptedSongQueue";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../globals.css";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/button";
import Loader from "@/components/loader";
import useEventStore from "@/store/eventStore";
import useDjStore from "@/store/djStore";
import useRequestStore from "@/store/requestStore";
import WebSocketService from "@/services/websocketService";
import { motion } from "framer-motion";

// Define interfaces for requests, events, and DJs
// Update the Request interface to match the API response
export interface Request {
  requestId: string; // Changed from number to string
  songName: string;
  songArtist: string;
  songImage: string;
  accepted: boolean; // Added
  played: boolean;
  requestUpvotes: number;
  userId: string | null; // Added
  eventId: string; // Added
  paymentId: string; // Added
  status: string;
  createdAt: string; // Added
  updatedAt: string; // Added
  User: null | any; // Added
  Event: {
    // Added
    eventName: string;
  };
  Payment: {
    // Added
    amount: number;
  };
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
          className="outline"
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
  const [socketConnected, setSocketConnected] = useState(false);
  const { user } = useUser();
  // Use the event store
  const { currentEvent, isLoading, fetchEvent } = useEventStore();
  const {
    fetchRequests,
    connectToEventSocket,
    disconnectFromEventSocket,
  } = useRequestStore();

  // Add a new state variable for loading event data
  const [isEventLoading, setIsEventLoading] = useState(true);

  // Add state for event DJs and active DJ

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
    const eventId =
      url.searchParams.get("eventId") || localStorage.getItem("eventId");

    if (!eventId) {
      return;
    }

    localStorage.setItem("eventId", eventId);

    try {
      // Set loading to true at the beginning of data fetch
      setIsEventLoading(true);

      // Get the current state from the event store
      const storeState = useEventStore.getState();

      // Only fetch event if it's not already in the store or if it's a different event
      if (
        !storeState.currentEvent ||
        storeState.currentEvent.eventId !== eventId
      ) {
        await fetchEvent(eventId);
      }

      // Get the updated state after potential fetch
      const currentEventFromStore = useEventStore.getState().currentEvent;

      

      if (!currentEventFromStore) {
        router.push("/404");
        return;
      }

      // Store the DJ ID from the event data
      const djId = currentEventFromStore.djId;
      localStorage.setItem("djId", djId);

      await fetchRequests(eventId);

      setRefreshing(false);
      // Set loading to false after all data is fetched
      setIsEventLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRefreshing(false);
      setIsEventLoading(false);
      router.push("/404");
    }
  };

  useEffect(() => {
    loadData();

  }, [router]);

  // Check WebSocket connection status periodically
  useEffect(() => {

    if (!currentEvent?.eventId) return;
    connectToEventSocket(currentEvent?.eventId || "");


    const intervalId = setInterval(() => {
      const wsService = WebSocketService.getInstance();
      setSocketConnected(wsService.isConnected());
    }, 5000);


    return () => {
      clearInterval(intervalId);
      disconnectFromEventSocket();
    };
  }, [currentEvent?.eventId, connectToEventSocket, disconnectFromEventSocket]);

  if (isLoading || isEventLoading) {
    return <Loader />;
  } else
    return (
      <div className="w-screen h-screen bg-gray-900 overflow-hidden">
        <div className="bg-gray-900 flex max-w-[600px] w-full h-screen flex-col overflow-hidden items-center mx-auto gap-2">
          <EventHeader
            title={currentEvent?.eventName || "Default Event Title"}
            imageUrl={currentEvent?.eventImage || ""}
          />

          <DJProfile
            name={
              currentEvent?.currentDjId 
                ? currentEvent?.DJs.find(dj => dj.djId === currentEvent.currentDjId)?.djName || ""
                : currentEvent?.DJs[0]?.djName || ""
            }
            role="Currently Playing"
            image={
              currentEvent?.currentDjId
                ? currentEvent?.DJs.find(dj => dj.djId === currentEvent.currentDjId)?.djImageUrl || "/RequestLogoDark.png"
                : currentEvent?.DJs[0]?.djImageUrl || "/RequestLogoDark.png"
            }
            insta={
              currentEvent?.currentDjId
                ? currentEvent?.DJs.find(dj => dj.djId === currentEvent.currentDjId)?.djInsta
                  ? `https://www.instagram.com/${currentEvent.DJs.find(dj => dj.djId === currentEvent.currentDjId)?.djInsta}`
                  : ""
                : currentEvent?.DJs[0]?.djInsta
                  ? `https://www.instagram.com/${currentEvent?.DJs[0].djInsta}`
                  : ""
            }
          />
          
          <div className="flex flex-col items-center w-full px-4 pb-20 mt-[-20] overflow-y-auto flex-1">
            {currentEvent?.djId && user?.id === currentEvent?.djId && (
              <EventOwnershipDisclaimer djId={currentEvent?.djId} />
            )}
            
            {/* Use the imported AcceptedSongQueue component */}
            <AcceptedSongQueue />
            
            {currentEvent?.acceptRequests ? (
              <div
                className={`flex items-center justify-center w-full h-[50px] bg-transparent ${isMobile ? "mb-[30px]" : ""}`}
              >
                <Link href="/request-song">
                  <motion.button
                    className="font-bold bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] w-full px-[100px] py-[19px] rounded-[15px]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Request a song
                  </motion.button>
                </Link>
              </div>
            ) : (
              <div
                className={`flex items-center justify-center w-full h-[40px]  bg-transparent ${isMobile ? "mb-[20px]" : ""}`}
              >
                <motion.button
                  className="bg-black/40 dark:bg-black/40 text-white shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] 
                    w-[90%]
                    h-12  
                    px-[15px]  
                    py-[8px]  
                    rounded-[15px] 
                    text-xs"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <strong>Requests are currently disabled</strong>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default EventPage;
