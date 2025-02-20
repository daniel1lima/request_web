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
} from "@/api/apiService";
import { v4 as uuidv4 } from "uuid";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "../button";
import { useRouter } from "next/navigation";

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
  free: boolean;
}

export const SongForm: React.FC<SongFormProps> = ({
  accessToken,
  onSongSelect,
  feedoptions,
  free,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [debouncedSearch] = useDebounce(searchInput, 200);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const resultsContainerRef = React.useRef<HTMLDivElement>(null);
  const elements = useElements();
  const stripe = useStripe();

  const router = useRouter();

  const fetchPaymentIntentFunc = async (
    amount: number,
    currency: string,
    requestId: string
  ) => {
    console.log(amount, currency, requestId);
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
      console.log(feedoptions.amount, feedoptions.currency);
      const { client_secret, id: pid } = await fetchPaymentIntentFunc(
        feedoptions.amount,
        feedoptions.currency,
        selectedTrack?.id || ""
      );

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      });

      // create payment

      await createPayment({
        paymentId: pid,
        amount: feedoptions.amount,
        djId: localStorage.getItem("djId") || "",
      });

      // Save Request to the database
      const RequestBody: RequestBody = {
        songName: selectedTrack?.name || "",
        songArtist: selectedTrack?.artists[0].name || "",
        songImage: selectedTrack?.album.images[1]?.url || "",
        userId: localStorage.getItem("requestapp_userId") || null,
        eventId: localStorage.getItem("eventId") || "",
        paymentId: pid,
      };

      await createRequest(RequestBody);

      setTimeout(() => {
        redirect(`/success`); // Navigate to the new post page
      }, 2000);

      if (error) {
        console.error("Payment confirmation error:", error.message);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Regex for email validation

  const handleFreeRequest = async () => {
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
      });

      console.log(paymentResponse);

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

      if (!requestResponse.ok) {
        setEmailLoading(false);
      }

      setEmailSuccess(true);
      setEmailLoading(false);

      // Redirect to success page
      setTimeout(() => {
        redirect(`/success`);
      }, 500);
    } catch (error) {
      console.error("Error:", error);
      setEmailError("Something went wrong. Please try again.");
      setEmailLoading(false);
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop <= clientHeight * 1.5 &&
      hasMore &&
      !isLoading
    ) {
      searchSpotify(true);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchResultClick = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setSearchInput(`${track.name} - ${track.artists[0].name}`);
    setSearchResults([]);
    onSongSelect?.(false);
    scrollToTop();
    const inputElement = document.getElementById(
      "song-input"
    ) as HTMLInputElement;
    inputElement.blur();
    if (inputElement) {
    }
  };

  const handleSearchContainerTouch = () => {
    // Dismiss keyboard when touching search results
    const inputElement = document.getElementById(
      "song-input"
    ) as HTMLInputElement;
    inputElement.blur();
    if (inputElement) {
    }
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
    if (inputElement) {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputElement = document.getElementById(
        "song-input"
      ) as HTMLInputElement;
      inputElement.blur();
      if (inputElement) {
      }
    }
  };

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
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSearchResultClick(track)}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 
                      cursor-pointer transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <img
                      src={track.album.images[2]?.url}
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
                ))}
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
            className="flex flex-col items-center mt-6 mb-32"
            suppressHydrationWarning
          >
            <img
              loading="lazy"
              src={selectedTrack.album.images[1]?.url || ""}
              className="w-28 h-28 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-lg object-cover shadow-lg"
              alt={selectedTrack.name}
            />
            <h2 className="text-gray-800 dark:text-gray-200 text-lg md:text-xl lg:text-2xl font-medium mt-4 text-center px-4">
              {selectedTrack.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base lg:text-lg mt-1">
              {selectedTrack.artists[0].name}
            </p>
            <div className="relative group">
              <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-[1px] rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 mt-3">
                <div className="px-6 py-2 rounded-full bg-gray-900/90 backdrop-blur-xl">
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-200 text-lg md:text-xl lg:text-2xl font-medium">
                    ${(Number(feedoptions.amount) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
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
              {free && (
                <div className="mb-4">
                  {showEmailInput ? (
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
                      <button
                        onClick={handleFreeRequest}
                        className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
                    shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-full px-[43px] py-[13px] 
                    mt-2 rounded-[8px] transition-all duration-300 ease-in-out"
                      >
                        {emailLoading ? (
                          <Loader2 className="animate-spin mx-auto" />
                        ) : (
                          "Submit Free Request"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowEmailInput(true);
                        setEmail("");
                        setEmailError("");
                        setEmailSuccess(false);
                      }}
                      className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
                  shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-full px-[43px] py-[13px] 
                  rounded-[8px] transition-all duration-300 ease-in-out"
                    >
                      Get First Request Free!
                    </button>
                  )}
                </div>
              )}
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
            </>
          )}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            You will not be charged until your song is played
          </p>
        </div>
      </div>
    </div>
  );
};
