"use client";

import React, { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { FaSearch, FaTimes } from "react-icons/fa";
import {
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { redirect } from "next/navigation";
import {
  fetchPaymentIntent,
  createPayment,
  createRequest,
  checkEmail,
  submitEmailToWaitlist,
  RequestBody,
  freeOrderConfirm,
  checkPhone,
  updateRequestStatus,
  REQUEST_STATUS,
} from "@/api/apiService";
import { v4 as uuidv4 } from "uuid";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "../button";
import { useRouter } from "next/navigation";
import PhoneInput, { formatPhoneNumber } from "./PhoneInput";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
}

interface SongFormProps {
  accessToken: string | null;
  onSongSelect?: (selected: boolean) => void;
  feedoptions: {
    // Define the structure of options here
    amount: number;
    currency: string;
  };
  freeReq: boolean;
  freeEmailReq: boolean;
}

export const SongForm: React.FC<SongFormProps> = ({
  accessToken,
  onSongSelect,
  feedoptions,
  freeEmailReq,
  freeReq,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [debouncedSearch] = useDebounce(searchInput, 300);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [freeRequestLoading, setFreeRequestLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [inputMethod, setInputMethod] = useState<"email" | "phone">("email");
  const [countryCode, setCountryCode] = useState("+1");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountryFlag, setSelectedCountryFlag] =
    useState<React.ReactNode>(
      <svg className="h-4 w-4 me-2" fill="none" viewBox="0 0 20 15">
        <rect width="19.6" height="14" y=".5" fill="#fff" rx="2" />
        <mask
          id="ca"
          style={{ maskType: "luminance" }}
          width="20"
          height="15"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
        >
          <rect width="19.6" height="14" y=".5" fill="#fff" rx="2" />
        </mask>
        <g mask="url(#ca)">
          <path fill="#fff" d="M0 .5h19.6v14H0z" />
          <path fill="#FF3131" d="M13.867.5H19.6v14h-5.733zM0 .5h5.733v14H0z" />
          <path
            fill="#FF3131"
            d="M8.4 4.167l-.933 1.866s-.467.934.466.934c.934 0 .467-.934.467-.934s.467.934 1.4.934c.934 0 0-1.4 0-1.4l.467-1.4L8.4 4.167z"
          />
          <path
            fill="#FF3131"
            d="M11.2 8.9L9.8 7.5l1.4-1.4-1.4-.467-.467-1.4-.933 1.4L7 5.167 7.467 7 7 7.5l1.4 1.4-.467 1.4 1.4-.467.933.934v.933h.467v-.933l.467-.867z"
          />
        </g>
      </svg>
    );

  const resultsContainerRef = React.useRef<HTMLDivElement>(null);
  const elements = useElements();
  const stripe = useStripe();

  const router = useRouter();

  const fetchPaymentIntentFunc = async (
    amount: number,
    currency: string,
    requestId: string
  ) => {
    const data = await fetchPaymentIntent(amount, currency, requestId);
    return { client_secret: data.client_secret, id: data.id };
  };

  const onConfirm = async () => {
    if (!stripe || !elements) {
      console.error("Stripe.js or Elements has not loaded correctly.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get payment intent from server
      const { client_secret, id: pid } = await fetchPaymentIntentFunc(
        feedoptions.amount,
        feedoptions.currency,
        selectedTrack?.id || ""
      );

      // 2. Create payment record first
      await createPayment({
        paymentId: pid,
        amount: feedoptions.amount,
        djId: localStorage.getItem("djId") || "",
        email: "",
        phone: "",
      });

      // 3. Create request with pending status
      const RequestBody: RequestBody = {
        songName: selectedTrack?.name || "",
        songArtist: selectedTrack?.artists[0].name || "",
        songImage: selectedTrack?.album.images[1]?.url || "",
        userId: localStorage.getItem("requestapp_userId") || null,
        eventId: localStorage.getItem("eventId") || "",
        paymentId: pid,
      };

      // Save Request to the database before payment confirmation
      await createRequest(RequestBody);

      // 4. Now confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment confirmation error:", error.message);

        await updateRequestStatus(pid, REQUEST_STATUS.FAILED);

        return;
      }

      // 5. If we get here without redirect, payment succeeded
      setTimeout(() => {
        redirect(`/paid-success`); // Navigate to the success page
      }, 1000);
    } catch (error) {
      console.error("Error confirming payment:", error);
      // Handle error, possibly show to user
    } finally {
      setIsLoading(false);
    }
  };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Regex for email validation
  const phoneRegex = /^\d{10}$/; // Regex for 10-digit phone number validation

  const handleFreeRequest = async () => {
    setFreeRequestLoading(true);

    try {
      // Generate a unique ID with a prefix for better tracking
      const freePaymentId = `FREE_${uuidv4()}`;

      // Prepare the request body once to avoid duplication
      const songRequestBody: RequestBody = {
        songName: selectedTrack?.name || "",
        songArtist: selectedTrack?.artists[0].name || "",
        songImage:
          selectedTrack?.album.images[1]?.url || "/RequestLogoDark.png", // Add fallback image
        userId: localStorage.getItem("requestapp_userId") || null,
        eventId: localStorage.getItem("eventId") || "",
        paymentId: freePaymentId,
      };

      // Create a free payment record first
      const paymentResponse = await createPayment({
        paymentId: freePaymentId,
        amount: 0,
        djId: localStorage.getItem("djId") || "",
        email: "",
        phone: "",
      });

      if (!paymentResponse) {
        throw new Error("Failed to create payment record");
      }

      // Create the request with the payment ID
      const requestResponse = await createRequest(songRequestBody);

      if (!requestResponse) {
        throw new Error("Failed to create request");
      }
    } catch (error) {
      console.error("Error processing free request:", error);
      // You could add user-facing error handling here
      // For example: setRequestError("Something went wrong. Please try again.");
    } finally {
      // Always reset loading state, even if there's an error
      redirect(`/free-success`);
    }
  };

  const handleFreeEmailRequest = async () => {
    setEmailLoading(true);

    if (!email) {
      setEmailError("Please enter your email");
      setEmailLoading(false);
      return;
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      setEmailLoading(false);
      return;
    }

    try {
      // Check if the email already exists in the waitlist
      const emailExists = await checkEmail(email);
      if (emailExists.exists) {
        setEmailError("This email has already been used for a free request");
        setEmailLoading(false);
        return;
      }

      // First try to submit email to waitlist using the correct endpoint
      await submitEmailToWaitlist({
        email,
        eventId: localStorage.getItem("eventId") || "",
        songRequested: selectedTrack?.name || "",
      });

      const freePaymentId = `FREE_${uuidv4()}`;

      // Create a free payment record first
      const paymentResponse = await createPayment({
        paymentId: freePaymentId,
        amount: 0,
        djId: localStorage.getItem("djId") || "",
        email: email,
        phone: "",
      });

      if (!paymentResponse) {
        setEmailLoading(false);
        throw new Error("Failed to create payment record");
      }

      // Then create the request with the payment ID

      const RequestBody: RequestBody = {
        songName: selectedTrack?.name || "",
        songArtist: selectedTrack?.artists[0].name || "",
        songImage: selectedTrack?.album.images[1]?.url || "",
        userId: localStorage.getItem("requestapp_userId") || null,
        eventId: localStorage.getItem("eventId") || "",
        paymentId: freePaymentId,
      };

      // Fetch request to create the request
      const requestResponse = await createRequest(RequestBody);

      if (!requestResponse) {
        setEmailSuccess(true);
      }

      await freeOrderConfirm(email, freePaymentId);

      // Redirect to success page
      setTimeout(() => {
        setEmailLoading(false);
        setEmailSuccess(true);
        redirect(`/phone-success`); // WE ARE NOT USING EMAILS SO I DINDT MAKE AN EMAIL PAGE
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setEmailError("Something went wrong. Please try again.");
      setEmailLoading(false);
    }
  };

  const handleFreePhoneRequest = async (formattedPhone?: string) => {
    setPhoneLoading(true);

    if (!phone) {
      setPhoneError("Please enter your phone number");
      setPhoneLoading(false);
      return;
    }

    // Validate phone format - simple 10 digit check
    const cleanedPhone = phone.replace(/\D/g, "");
    if (!phoneRegex.test(cleanedPhone)) {
      setPhoneError("Please enter a valid 10-digit phone number");
      setPhoneLoading(false);
      return;
    }

    // Use the formatted phone with country code if provided, otherwise use default +1
    const phoneWithCountryCode = formattedPhone || `+1${cleanedPhone}`;

    try {
      // Check if the phone already exists in the waitlist
      const phoneExists = await checkPhone(phoneWithCountryCode); // Reusing the email endpoint for now
      if (phoneExists.exists) {
        setPhoneError(
          "This phone number has already been used for a free request"
        );
        setPhoneLoading(false);
        return;
      }

      // Submit phone to waitlist using the same endpoint as email
      await submitEmailToWaitlist({
        email: `${phoneWithCountryCode}`, // Prefix to distinguish from emails
        eventId: localStorage.getItem("eventId") || "",
        songRequested: selectedTrack?.name || "",
      });

      const freePaymentId = `FREE_${uuidv4()}`;

      // Create a free payment record
      const paymentResponse = await createPayment({
        paymentId: freePaymentId,
        amount: 0,
        djId: localStorage.getItem("djId") || "",
        email: "",
        phone: `${phoneWithCountryCode}`, // Store phone with prefix
      });

      if (!paymentResponse) {
        setPhoneLoading(false);
        throw new Error("Failed to create payment record");
      }

      // Create the request with the payment ID
      const RequestBody: RequestBody = {
        songName: selectedTrack?.name || "",
        songArtist: selectedTrack?.artists[0].name || "",
        songImage: selectedTrack?.album.images[1]?.url || "",
        userId: localStorage.getItem("requestapp_userId") || null,
        eventId: localStorage.getItem("eventId") || "",
        paymentId: freePaymentId,
      };

      const requestResponse = await createRequest(RequestBody);

      if (requestResponse) {
        // Only send confirmation and redirect if request was successful
        await freeOrderConfirm(`${phoneWithCountryCode}`, freePaymentId);
        setPhoneSuccess(true);
        setPhoneLoading(false);
        router.push(`/phone-success`);  // HERE
      } else {
        throw new Error("Failed to create request");
      }
    } catch (error) {
      console.error("Error:", error);
      setPhoneError("Something went wrong. Please try again.");
      setPhoneLoading(false);
    }
  };

  const searchSpotify = async (isLoadingMore = false) => {
    if (!debouncedSearch || isLoading) return;

    setIsLoading(true);
    try {
      const currentOffset = isLoadingMore ? offset : 0;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          debouncedSearch
        )}&type=track&limit=20&offset=${currentOffset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();

      if (isLoadingMore) {
        setSearchResults((prev) => [...prev, ...data.tracks.items]);
      } else {
        setSearchResults(data.tracks.items);
      }

      setHasMore(data.tracks.items.length === 20);
      setOffset(currentOffset + data.tracks.items.length);
    } catch (error) {
      console.error("Error searching Spotify:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    searchSpotify();
  }, [debouncedSearch]);

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop <= clientHeight * 1.5 &&
        hasMore &&
        !isLoading
      ) {
        searchSpotify(true);
      }
    },
    [hasMore, isLoading, searchSpotify]
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchResultClick = React.useCallback(
    (track: SpotifyTrack) => {
      setSelectedTrack(track);
      setSearchInput(`${track.name} - ${track.artists[0].name}`);
      setSearchResults([]);
      onSongSelect?.(false);
      scrollToTop();
      const inputElement = document.getElementById(
        "song-input"
      ) as HTMLInputElement;
      inputElement.blur();
    },
    [onSongSelect, scrollToTop]
  );

  const handleSearchContainerTouch = () => {
    // Dismiss keyboard when touching search results
    const inputElement = document.getElementById(
      "song-input"
    ) as HTMLInputElement;
    inputElement.blur();
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchResults([]);
    setSelectedTrack(null);
    onSongSelect?.(false);
    scrollToTop();
    const inputElement = document.getElementById(
      "song-input"
    ) as HTMLInputElement;
    inputElement.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputElement = document.getElementById(
        "song-input"
      ) as HTMLInputElement;
      inputElement.blur();
    }
  };

  // Memoize the search results to prevent unnecessary re-renders
  const memoizedSearchResults = React.useMemo(() => {
    return searchResults.map((track) => (
      <div
        key={track.id}
        onClick={() => handleSearchResultClick(track)}
        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 
          cursor-pointer transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
      >
        <img
          src={track.album.images[2]?.url || "/RequestLogoDark.png"}
          alt={track.name}
          className="w-12 h-12 rounded-lg shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {track.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {track.artists[0].name}
          </div>
        </div>
      </div>
    ));
  }, [searchResults]);

  // Memoize callback functions
  const handleSearchSpotify = React.useCallback(
    async (isLoadingMore = false) => {
      if (!debouncedSearch || isLoading) return;

      setIsLoading(true);
      try {
        const currentOffset = isLoadingMore ? offset : 0;
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            debouncedSearch
          )}&type=track&limit=20&offset=${currentOffset}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();

        if (isLoadingMore) {
          setSearchResults((prev) => [...prev, ...data.tracks.items]);
        } else {
          setSearchResults(data.tracks.items);
        }

        setHasMore(data.tracks.items.length === 20);
        setOffset(currentOffset + data.tracks.items.length);
      } catch (error) {
        console.error("Error searching Spotify:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, isLoading, offset, accessToken]
  );

  return (
    <div>
      {/* Render CheckMarkAnimation when showSuccessAnimation is true */}

      <form
        className="flex flex-col w-full h-full relative pb-20"
        onSubmit={(e) => e.preventDefault()}
        suppressHydrationWarning
      >
        {/* Search Input Container */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/event?eventId=${localStorage.getItem("eventId")}`)
            }
            className="p-2 bg-slate-600 hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </Button>

          <div
            className="flex-1 bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 border flex items-stretch gap-5 text-base text-neutral-500 dark:text-gray-400 font-normal leading-loose justify-between px-3.5 py-[18px] rounded-[15px] border-solid"
            suppressHydrationWarning
          >
            <input
              id="song-input"
              type="text"
              value={
                selectedTrack
                  ? `${selectedTrack.name} - ${selectedTrack.artists[0].name}`
                  : searchInput
              }
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchInput(newValue);
                setSelectedTrack(null);
                if (newValue === "") {
                  setSearchResults([]);
                  onSongSelect?.(false);
                } else if (onSongSelect) {
                  onSongSelect(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search for a song"
              className="bg-transparent outline-none w-full dark:text-white"
            />
            <button
              type="button"
              onClick={searchInput || selectedTrack ? handleClear : undefined}
              className="mt-1 p-1 -mr-1 rounded-full  transition-colors"
            >
              {searchInput || selectedTrack ? (
                <FaTimes className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" />
              ) : (
                <FaSearch className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" />
              )}
            </button>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && !selectedTrack && (
              <div
                ref={resultsContainerRef}
                onScroll={handleScroll}
                onTouchStart={handleSearchContainerTouch}
                className="absolute left-0 right-0 top-20 
                  bg-white dark:bg-gray-800 
                  border dark:border-gray-700 rounded-2xl shadow-xl z-50 
                  max-h-[70vh] overflow-y-auto backdrop-blur-sm"
              >
                {memoizedSearchResults}
                {isLoading && (
                  <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                    <div className="animate-pulse">Loading more songs...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Empty State - Only show when no search and no selection */}
        {!searchInput && !selectedTrack && !searchResults.length && (
          <div
            className="flex flex-col items-center justify-center mt-10"
            suppressHydrationWarning
          >
            <div className="text-gray-600 dark:text-gray-600 text-6xl mb-4">
              <FaSearch />
            </div>
            <p className="text-gray-400 dark:text-gray-400 text-center">
              Search for a Song
            </p>
          </div>
        )}

        {/* Selected Song Display */}
        {selectedTrack && (
          <div
            className="flex flex-col items-center justify-center mt-6 mb-30"
            suppressHydrationWarning
          >
            <img
              loading="lazy"
              src={selectedTrack.album.images[1]?.url || "/RequestLogoDark.png"}
              className={`mt-20 rounded-lg object-cover shadow-lg ${
                freeReq ? "w-48 h-48" : "w-28 h-28"
              }`}
              alt={selectedTrack.name}
              fetchPriority="high"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = "/RequestLogoDark.png";
              }}
            />
            <h2 className="text-gray-800 dark:text-gray-200 text-lg md:text-xl lg:text-2xl font-medium mt-4 text-center px-4">
              {selectedTrack.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base lg:text-lg mt-1">
              {selectedTrack.artists[0].name}
            </p>
            {!freeReq && (
              <div className="relative group">
                <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-[1px] rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 mt-3">
                  <div className="px-6 py-2 rounded-full bg-gray-900/90 backdrop-blur-xl">
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-200 text-lg md:text-xl lg:text-2xl font-medium">
                      ${(Number(feedoptions.amount) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
      {/* Bottom Action Section */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-900 
     p-4 pb-8"
        suppressHydrationWarning
      >
        <div className="max-w-[480px] mx-auto mb-2 bg-transparent">
          {selectedTrack && (
            <>
              {freeEmailReq ? (
                <div className="mb-4">
                  {!showEmailInput && !showPhoneInput ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setShowPhoneInput(true);
                          setInputMethod("phone");
                          setPhone("");
                          setPhoneError("");
                          setPhoneSuccess(false);
                        }}
                        className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
                        shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-full px-[43px] py-[13px] 
                        rounded-[8px] transition-all duration-300 ease-in-out"
                      >
                        Request with Phone
                      </button>
                    </div>
                  ) : showEmailInput ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError("");
                          setEmailLoading(false);
                        }}
                        placeholder="Enter your e-mail"
                        className={`w-full px-4 py-2 rounded-lg bg-gray-800 text-white border 
                        ${emailError ? "border-red-500" : "border-gray-700"} 
                        ${emailSuccess ? "border-green-400" : "border-gray-700"} 
                        focus:outline-none focus:border-blue-500
                        transition-all duration-300 ease-in-out opacity-100 transform translate-y-0`}
                      />
                      {emailError && (
                        <p className="text-red-500 text-sm text-center transition-opacity duration-200">
                          {emailError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowEmailInput(false);
                            setShowPhoneInput(false);
                          }}
                          className="bg-gray-700 w-1/4 px-[10px] py-[13px] 
                          rounded-[8px] transition-all duration-300 ease-in-out"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleFreeEmailRequest}
                          className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
                          shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-3/4 px-[43px] py-[13px] 
                          rounded-[8px] transition-all duration-300 ease-in-out"
                        >
                          {emailLoading ? (
                            <Loader2 className="animate-spin mx-auto" />
                          ) : (
                            "Submit Free Request"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    showPhoneInput && 
                        <PhoneInput
                          phone={phone}
                          setPhone={setPhone}
                          phoneError={phoneError}
                          setPhoneError={setPhoneError}
                          setPhoneLoading={setPhoneLoading}
                          countryCode={countryCode}
                          setCountryCode={setCountryCode}
                          selectedCountryFlag={selectedCountryFlag}
                          setSelectedCountryFlag={setSelectedCountryFlag}
                          onSubmit={handleFreePhoneRequest}
                          onBack={() => {
                            setShowEmailInput(false);
                            setShowPhoneInput(false);
                            setShowCountryDropdown(false);
                          }}
                          isLoading={phoneLoading}
                        />

                  )}
                </div>
              ) : (
                freeReq && (
                  <div className="mb-4">
                    {freeRequestLoading ? (
                      <div
                        className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
      shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-full px-[43px] py-[13px] 
      rounded-[8px] transition-all duration-300 ease-in-out z-50 
      flex items-center justify-center"
                      >
                        <Loader2 className="animate-spin" />
                      </div>
                    ) : (
                      <button
                        onClick={handleFreeRequest}
                        className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
      shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-full px-[43px] py-[13px] 
      rounded-[8px] transition-all duration-300 ease-in-out z-50 font-bold"
                      >
                        Request For Free!
                      </button>
                    )}
                  </div>
                )
              )}
              {!freeReq && (
                <>
                  <ExpressCheckoutElement
                    onConfirm={onConfirm}
                    onClick={({ resolve }) => {
                      const options = {
                        emailRequired: true,
                        phoneNumberRequired: true,
                      };
                      resolve(options);
                    }}
                  />
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
                    You will not be charged until your song is played
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
