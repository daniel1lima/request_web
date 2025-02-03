"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SongForm } from "./SongForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";

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
  // const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true); // State to track loading
  const [options, setOptions] = useState<CustomStripeElementsOptions>({
    mode: "payment" as const,
    amount: 50, // Default amount
    currency: "cad",
    capture_method: "manual",
  });

  const router = useRouter();

  const getSpotifyToken = async () => {
    try {
      const response = await fetch("/api/spotify/auth", {
        headers: {
          Accept: "application/json",
        },
      });
      const data = await response.json();

      if (data.error) {
        console.error("Error from backend:", data.error);
        return;
      }

      console.log("Token received");
      setAccessToken(data.access_token);
    } catch (error) {
      console.log("Error fetching Spotify token:", error);
    }
  };

  const fetchEventData = async () => {
    const eventId = localStorage.getItem("eventId");
    if (!eventId) {
      router.push("/404"); // Redirect to 404 if eventId is null
      return;
    }

    try {
      const response = await fetch(`api/events/getById?eventId=${eventId}`);
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching event data:", data.error);
        router.push("/404"); // Redirect to 404 if event does not exist
        return;
      }

      console.log("Event data received:", data);
      // setEventData(data);
      setOptions((prevOptions) => ({
        ...prevOptions,
        amount: data.requestFee,
      }));
      setLoading(false); // Set loading to false after fetching event data
    } catch (error) {
      console.log("Error fetching event data:", error);
      router.push("/404"); // Redirect to 404 on fetch error
    }
  };

  useEffect(() => {
    getSpotifyToken();
    fetchEventData();
  }, []);

  const handleSongSelect = (selected: boolean) => {
    setShowHeader(!selected);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <Loader2 className="text-white animate-spin" />; // Show loader while loading
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
        {/* Logo Section */}
        <div className="flex justify-center pt-6 pb-2 px-4 h-[200px] w-[200px] mx-auto">
          <Image
            src="/RequestLogoLight.png"
            alt="DJ Request Logo"
            width={300}
            height={300}
            className="invert dark:invert"
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Title Section */}
        <div className="flex flex-col w-full text-center pb-3 px-4">
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">
            Find and request your favorite tracks
          </p>
        </div>
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
          />
        </Elements>
      </div>
    </div>
  );
};
