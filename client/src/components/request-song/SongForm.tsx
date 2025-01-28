"use client";

import React, { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { FaSearch } from "react-icons/fa";

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
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'buy-button-id': string;
        'publishable-key': string;
      };
    }
  }
}

export const SongForm: React.FC<SongFormProps> = ({ accessToken }) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const resultsContainerRef = React.useRef<HTMLDivElement>(null);

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
            Authorization:
              `Bearer ${accessToken}`,
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

  useEffect(() => {
    // Load Stripe buy button script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  return (
    <form className="flex flex-col w-full">
      <div className="relative bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700 border flex items-stretch gap-5 text-base text-neutral-500 dark:text-gray-400 font-normal leading-loose justify-between mt-3 px-3.5 py-[18px] rounded-[15px] border-solid">
        <input
          id="song-input"
          type="text"
          value={
            selectedTrack
              ? `${selectedTrack.name} - ${selectedTrack.artists[0].name}`
              : searchInput
          }
          onChange={(e) => {
            setSearchInput(e.target.value);
            setSelectedTrack(null);
          }}
          placeholder="Search for a song"
          className="bg-transparent outline-none w-full dark:text-white"
        />
        {selectedTrack ? (
          <img
            loading="lazy"
            src={selectedTrack.album.images[2]?.url || ""}
            className="w-7 h-7 rounded object-cover shrink-0 my-auto"
          />
        ) : (
          <div className="mt-2">
            <FaSearch />
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && !selectedTrack && (
          <div
            ref={resultsContainerRef}
            onScroll={handleScroll}
            className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto"
          >
            {searchResults.map((track) => (
              <div
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track);
                  setSearchInput(`${track.name} - ${track.artists[0].name}`);
                  setSearchResults([]);
                }}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <img
                  src={track.album.images[2]?.url}
                  alt={track.name}
                  className="w-10 h-10 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{track.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {track.artists[0].name}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center p-2 text-gray-500 dark:text-gray-400">
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center mt-10">
        {selectedTrack ? (
          <img
            loading="lazy"
            src={selectedTrack.album.images[1]?.url || ""}
            className="w-54 h-54 rounded object-cover shrink-0 my-auto"
          />
        ) : (
          <div className="mt-2">
            <FaSearch />
          </div>
        )}

        {selectedTrack ? (
          <h2 className="text-gray-800 dark:text-gray-200 text-lg font-medium leading-[34px] text-center self-center mt-[17px]">
            {selectedTrack.name}
          </h2>
        ) : (
          <h2 className="text-gray-800 dark:text-gray-200 text-lg font-medium leading-[34px] text-center self-center mt-[17px]">
            No Song Selected
          </h2>
        )}
      </div>

      {/* <div className="flex items-stretch gap-5 leading-[34px] justify-between mt-[47px]">
        <div className="text-[#120D26] text-base font-medium">
          Current Request Fee
        </div>
        <div className="text-[rgba(63,56,221,1)] text-lg font-bold text-right">
          24.99 AED
        </div>
      </div> */}

      <p className="text-gray-900 dark:text-gray-100 text-xs font-normal leading-none text-center mt-[18px]">
        You will not be charged until your song is played.
      </p>

      <div className="flex flex-col items-center mt-4 fixed bottom-10 left-0 right-0">
        {selectedTrack ? (
          <stripe-buy-button
            buy-button-id="buy_btn_1QmNacIxGe3lgVLrfSAxDksx"
            publishable-key="pk_live_51QmNAjIxGe3lgVLrzftNbBXr9LNNY3MbIWlupy3geBMzzpYLxL8DkPRWhZhi7U5YIXWgfQggwEUV9X4JvDkQpJPH006CXImO1h"
            className="w-full flex justify-center"
          />
        ) : (
          <button
            disabled
            className="bg-gray-400 self-center w-[250px] text-base text-white font-bold text-center uppercase tracking-[1px] mt-[27px] px-[23px] py-[19px] rounded-[14px]"
          >
            Select a Song
          </button>
        )}
        <p className="bg-blend-normal text-gray-800 dark:text-gray-200 text-base font-light leading-7 text-center self-center mt-[7px]">
          {selectedTrack 
            ? "Click the button above to request this song"
            : "Select any song to request from the search above"}
        </p>
      </div>
    </form>
  );
};
