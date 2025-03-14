"use client";

import React, { useEffect, useState } from "react";
import { notFound, redirect, useRouter } from "next/navigation";
import { SongForm } from "./SongForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { fetchEventById, spotifyAuth } from "../../api/apiService";
import { useEventStore } from "@/store/eventStore";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type CustomStripeElementsOptions = StripeElementsOptions & {
  amount?: number;
  currency?: string;
};

export const RequestSong = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [loading, setLoading] = useState(true); // State to track loading
  const [options, setOptions] = useState<CustomStripeElementsOptions>({
    mode: "payment" as const,
    amount: 50, // Default amount
    currency: "cad",
    capture_method: "manual",
  });
  
  const [freeReq, setFreeReq] = useState(true);
  const [freeEmailReq, setFreeEmailReq] = useState(true);
  
  // Use the class-based store
  const eventStore = useEventStore();
  const router = useRouter();

  useEffect(() => {
    // Disable scrolling on body when component mounts
    document.ontouchmove = function(event){
      event.preventDefault();
    }
  
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getSpotifyToken = async () => {
    try {
      const response = await spotifyAuth();
      const data = response;

      if (data.error) {
        console.error("Error from backend:", data.error);
        return;
      }

      setAccessToken(data.access_token);
    } catch (error) {
      console.log("Error fetching Spotify token:", error);
    }
  };

  const fetchEventData = async () => {
    // Get eventId from URL or localStorage instead of relying on the store
    const eventId = new URL(window.location.href).searchParams.get("eventId") || 
    localStorage.getItem("eventId");
    
    if (!eventId) {
      console.error("No eventId found in URL or localStorage");
      router.push("/404");
      return;
    }

    try {
      // First, ensure we have the event data in the store
      if (!eventStore.currentEvent) {
        await eventStore.fetchEvent(eventId);
      }
      
      // If still no event after fetching, redirect
      if (!eventStore.currentEvent) {
        console.error("Failed to fetch event data");
        router.push("/404");
        return;
      }

      // Now fetch the event data directly to get the latest settings
      const data = await fetchEventById(eventId);

      if (!data || data.error) {
        console.error("Error fetching event data:", data?.error || "No data returned");
        router.push("/404");
        return;
      }

      // Check if requests are accepted
      if (!(data.acceptRequests)) {
        console.log("Event is not accepting requests");
        router.push(`/event?eventId=${eventId}`);
        return;
      }

      // Set the request options based on event settings
      setFreeReq(data.acceptFreeRequests || false);
      setFreeEmailReq(data.acceptEmailRequests || false);

      setOptions((prevOptions) => ({
        ...prevOptions,
        amount: data.requestFee,
      }));
      
      // Store the eventId for later use
      localStorage.setItem("eventId", eventId);
      
      setLoading(false);
    } catch (error) {
      console.error("Error in fetchEventData:", error);
      router.push("/404");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          getSpotifyToken(),
          fetchEventData()
        ]);
      } catch (error) {
        console.error("Error initializing data:", error);
        router.push("/404");
      }
    };

    initializeData();
  }, []);

  const handleSongSelect = (selected: boolean) => {
    setShowHeader(!selected);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="text-white animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 dark:bg-gray-900 max-w-[480px] w-full min-h-screen overflow-x-hidden">
      {/* Logo and Title Sections with animation */}
      <div
        className={`transition-all duration-500 ease-in-out transform ${
          showHeader
            ? "opacity-100 translate-y-0 max-h-[200px] mb-12"
            : "opacity-0 -translate-y-12 max-h-0 mb-0"
        }`}
      >
      </div>

      {/* Form Section */}
      <div
        className={` flex w-full flex-col px-4 transition-all duration-500 ease-in-out ${
          !showHeader ? "mt-10" : "mt-0"
        }`}
      >
        <Elements stripe={stripePromise} options={options}>
          <SongForm
            accessToken={accessToken}
            onSongSelect={handleSongSelect}
            feedoptions={{ amount: options.amount!, currency: options.currency! }}
            freeReq={freeReq}
            freeEmailReq={freeEmailReq}
          />
        </Elements>
      </div>
    </div>
  );
};
