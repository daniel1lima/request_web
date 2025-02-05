'use client';

import React, { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { FaSearch, FaTimes } from "react-icons/fa";
import {ExpressCheckoutElement, useElements, useStripe} from '@stripe/react-stripe-js';
import { redirect } from "next/navigation";
import apiFetch from "@/utils/api";

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
  feedoptions: { // Define the structure of options here
    amount: number;
    currency: string;
  };
}

export const SongForm: React.FC<SongFormProps> = ({
  accessToken,
  onSongSelect,
  feedoptions
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const resultsContainerRef = React.useRef<HTMLDivElement>(null);
  const elements = useElements();
  const stripe = useStripe()


  // const applePayOptions = {
  //   applePay: {
  //     deferredPaymentRequest: {
  //       paymentDescription: 'My deferred payment',
  //       managementURL: 'https://example.com/billing',
  //       deferredBilling: {
  //         amount: 2500,
  //         label: 'Deferred Fee',
  //         deferredPaymentDate: new Date('2024-01-05')
  //       },
  //     }
  //   }
  // };

  
  const fetchPaymentIntent = async (amount: number, currency: string) => {
    const response = await apiFetch(`/stripe/createPaymentIntent?amount=${amount}&currency=${currency}`, {
      method: 'POST', // Specify the method if needed
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch payment intent");
    }
    const data = await response.json();
    return { client_secret: data.client_secret, id: data.id };
  };

  const onConfirm = async () => {
    

    if (!stripe || !elements) {
      console.error("Stripe.js or Elements has not loaded correctly.");
      return;
    }

    setIsLoading(true);
    try {
      const { client_secret, id: pid } = await fetchPaymentIntent(feedoptions.amount, feedoptions.currency);

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      

      if (error) {
        console.error("Payment confirmation error:", error.message);
      } else {
        //console.log("Payment successful");

        // create payment
        // Fetch request to create payment
        const paymentResponse = await apiFetch('/payment/createPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: pid,
            amount: feedoptions.amount,
            djId: localStorage.getItem('djId'), 
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Failed to create payment');
        }

        //console.log("Payment created successfully:", paymentData);


        

        // Save Request to the database
        const requestBody = {
          songName: selectedTrack?.name,
          songArtist: selectedTrack?.artists[0].name,
          songImage: selectedTrack?.album.images[1]?.url,
          userId: localStorage.getItem('requestapp_userId') || null, 
          eventId: localStorage.getItem('eventId'), // Replace with actual event ID
          paymentId: pid,
        };

        // Fetch request to create the request
        const requestResponse = await apiFetch('/requests/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const requestData = await requestResponse.json();

        if (!requestResponse.ok) {
          throw new Error(requestData.error || 'Failed to create request');
        }

        //console.log("Request created successfully:", requestData);


        setTimeout(() => {
          redirect(`/success`) // Navigate to the new post page
        }, 3000);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
    } finally {
      setIsLoading(false);
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
    const inputElement = document.getElementById("song-input") as HTMLInputElement;
    inputElement.blur();
    if (inputElement) {
    }
  };

  const handleSearchContainerTouch = () => {
    // Dismiss keyboard when touching search results
    const inputElement = document.getElementById("song-input") as HTMLInputElement;
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
    const inputElement = document.getElementById("song-input") as HTMLInputElement;
    inputElement.blur();
    if (inputElement) {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputElement = document.getElementById("song-input") as HTMLInputElement;
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
        {/* Search Input */}
        <div
          className="relative bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 border flex items-stretch gap-5 text-base text-neutral-500 dark:text-gray-400 font-normal leading-loose justify-between px-3.5 py-[18px] rounded-[15px] border-solid"
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
              className="absolute left-4 right-4 top-full mt-2 bg-white dark:bg-gray-800 
                border  dark:border-gray-700 rounded-2xl shadow-xl z-50 
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

        {/* Empty State - Only show when no search and no selection */}
        {!searchInput && !selectedTrack && !searchResults.length && (
          <div className="flex flex-col items-center justify-center mt-10" suppressHydrationWarning>
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
          <div className="flex flex-col items-center mt-6 mb-32" suppressHydrationWarning>
            <img
              loading="lazy"
              src={selectedTrack.album.images[1]?.url || ""}
              className="w-48 h-48 rounded-lg object-cover shadow-lg"
              alt={selectedTrack.name}
            />
            <h2 className="text-gray-800 dark:text-gray-200 text-lg font-medium mt-4 text-center px-4">
              {selectedTrack.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {selectedTrack.artists[0].name}
            </p>
          </div>
        )}
      </form>
      {/* Bottom Action Section */}
      <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-900 
           p-4 pb-8 z-50"
          suppressHydrationWarning
        >
          <div className="max-w-[480px] mx-auto mb-2">
            {selectedTrack ? (
              <ExpressCheckoutElement onConfirm={onConfirm}/>
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              </div>
            )}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
              You will not be charged until your song is played
            </p>
          </div>
        </div>
    </div>
  );
};
