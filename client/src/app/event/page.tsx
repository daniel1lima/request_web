"use client";
import React, { useEffect, useState } from "react";
import { BiDonateHeart } from "react-icons/bi";
import EventHeader from "@/components/event/EventHeader";
import DJProfile from "@/components/event/DJprofile";
import AcceptedSongQueue from "@/components/event/AcceptedSongQueue";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../globals.css";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/button";
import Loader from "@/components/loader";
// Import the new class-based store hooks
import { useEventStore } from "@/store/eventStore";
import { useRequestStore } from "@/store/requestStore";
import WebSocketService from "@/services/websocketService";
import { motion } from "framer-motion";
import { createDonationSession } from "@/api/apiService";

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
const EventOwnershipDisclaimer = ({ djId, eventId, eventName }: { djId: string, eventId: string, eventName: string }) => {
  const { user } = useUser();
  const isOwner = user?.id === djId;
  const router = useRouter();

  const handleDonation = async () => {
    try {
      const { url } = await createDonationSession({
        eventId: eventId || '',
        djId: djId,
        eventName: eventName || '',
      });
      
      if (url) {
        router.push(url);
      }
    } catch (error) {
      console.error('Error creating donation session:', error);
    }
  };

  return (
    <div className="text-gray-200 dark:text-gray-200 text-sm mt-6">
      {isOwner ? (
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
      ) : (
        <Button
          className="relative group overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-3 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105"
          onClick={handleDonation}
        >
          <span className="relative z-10 flex items-center gap-2">
            <BiDonateHeart className="transition-transform group-hover:scale-125" />
            Tip your DJ!
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
  
  // Use the class-based stores
  const eventStore = useEventStore();
  const requestStore = useRequestStore();

  // Add a new state variable for loading event data
  const [isEventLoading, setIsEventLoading] = useState(true);

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

      // Check if we already have the current event
      if (!eventStore.currentEvent || eventStore.currentEvent.eventId !== eventId) {
        await eventStore.fetchEvent(eventId);
      }

      // If we still don't have an event after trying to fetch it
      if (!eventStore.currentEvent) {
        router.push("/");
        return;
      }

      // Store the DJ ID from the event data
      const djId = eventStore.currentEvent.djId;
      localStorage.setItem("djId", djId);

      await requestStore.fetchRequests(eventId);

      setRefreshing(false);
      // Set loading to false after all data is fetched
      setIsEventLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRefreshing(false);
      setIsEventLoading(false);
      router.push("/");
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Check WebSocket connection status periodically
  useEffect(() => {
    if (!eventStore.currentEvent?.eventId) return;
    
    requestStore.connectToEventSocket(eventStore.currentEvent.eventId);

    const intervalId = setInterval(() => {
      const wsService = WebSocketService.getInstance();
      setSocketConnected(wsService.isConnected());
    }, 5000);

    return () => {
      clearInterval(intervalId);
      requestStore.disconnectFromEventSocket();
    };
  }, [eventStore.currentEvent?.eventId, requestStore]);

  if (eventStore.isLoading || isEventLoading) {
    return <Loader />;
  } else
    return (
      <div className="w-screen h-screen bg-gray-900 overflow-hidden">
        <div className="bg-gray-900 flex max-w-[600px] w-full h-screen flex-col overflow-hidden items-center mx-auto gap-2">
          <EventHeader
            title={eventStore.currentEvent?.eventName || "Default Event Title"}
            imageUrl={eventStore.currentEvent?.eventImage || ""}
          />

          <DJProfile
            name={
              eventStore.currentEvent?.currentDjId 
                ? eventStore.currentEvent?.DJs.find(dj => dj.djId === eventStore.currentEvent?.currentDjId)?.djName || ""
                : eventStore.currentEvent?.DJs[0]?.djName || ""
            }
            role="Currently Playing"
            image={
              eventStore.currentEvent?.currentDjId
                ? eventStore.currentEvent?.DJs.find(dj => dj.djId === eventStore.currentEvent?.currentDjId)?.djImageUrl || "/RequestLogoDark.png"
                : eventStore.currentEvent?.DJs[0]?.djImageUrl || "/RequestLogoDark.png"
            }
            insta={
              eventStore.currentEvent?.currentDjId
                ? eventStore.currentEvent?.DJs.find(dj => dj.djId === eventStore.currentEvent?.currentDjId)?.djInsta
                  ? `https://www.instagram.com/${eventStore.currentEvent?.DJs.find(dj => dj.djId === eventStore.currentEvent?.currentDjId)?.djInsta}`
                  : ""
                : eventStore.currentEvent?.DJs[0]?.djInsta
                  ? `https://www.instagram.com/${eventStore.currentEvent?.DJs[0].djInsta}`
                  : ""
            }
          />
          
          <div className="flex flex-col items-center w-full px-4 pb-20 mt-[-20] overflow-y-auto flex-1">
            
              <EventOwnershipDisclaimer djId={eventStore.currentEvent?.djId || ""} eventId={eventStore.currentEvent?.eventId || ""} eventName={eventStore.currentEvent?.eventName || ""} />
            {/* Use the imported AcceptedSongQueue component */}
            <AcceptedSongQueue />
            
            {eventStore.currentEvent?.acceptRequests ? (
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
