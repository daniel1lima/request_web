"use client";

import React, { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { FaSearch, FaTimes } from "react-icons/fa";

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

export const SongForm: React.FC<SongFormProps> = ({ accessToken, onSongSelect }) => {
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchResultClick = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setSearchInput(`${track.name} - ${track.artists[0].name}`);
    setSearchResults([]);
    onSongSelect?.(false);
    scrollToTop();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleSearchContainerTouch = () => {
    // Dismiss keyboard when touching search results
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchResults([]);
    setSelectedTrack(null);
    onSongSelect?.(false);
    scrollToTop();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  return (
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
          value={selectedTrack ? `${selectedTrack.name} - ${selectedTrack.artists[0].name}` : searchInput}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearchInput(newValue);
            setSelectedTrack(null);
            if (newValue === '') {
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
              border border-neutral-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 
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
        <div className="flex flex-col items-center justify-center mt-10">
          <div className="text-gray-600 dark:text-gray-600 text-6xl mb-4">
            <FaSearch />
          </div>
          <p className="text-gray-400 dark:text-gray-400 text-center">
            Search for a song to request
          </p>
        </div>
      )}

      {/* Selected Song Display */}
      {selectedTrack && (
        <div className="flex flex-col items-center mt-6 mb-32">
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

      {/* Bottom Action Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-900/80 
        backdrop-blur-md border-t dark:border-gray-900 p-4 pb-8 z-50">
        <div className="max-w-[480px] mx-auto">
          {selectedTrack && (
            <>
              <stripe-buy-button
                buy-button-id="buy_btn_1QmNacIxGe3lgVLrfSAxDksx"
                publishable-key="pk_live_51QmNAjIxGe3lgVLrzftNbBXr9LNNY3MbIWlupy3geBMzzpYLxL8DkPRWhZhi7U5YIXWgfQggwEUV9X4JvDkQpJPH006CXImO1h"
                className="w-full flex justify-center [&>iframe]:!w-full [&>iframe]:!max-w-none [&>iframe]:!h-[42px] [&>iframe]:!min-h-0 [&>iframe]:rounded-xl [&>iframe]:shadow-lg [&>iframe]:transition-transform [&>iframe]:duration-200 [&>iframe]:hover:scale-[1.02] [&>iframe]:active:scale-[0.98]"
              />
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                You will not be charged until your song is played
              </p>
            </>
          )}
        </div>
      </div>
    </form>
  );
};
