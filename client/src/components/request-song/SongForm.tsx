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

export const SongForm = () => {
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
              "Bearer BQDWQ9KM5xV42qmoHr5x7vpfnPtIDYsWvgIcAeoDCnAvr3XL0UFH6XxyN77QvH3HKaNSe2Rl4Pc2v98GiLQ-qkIfoF2ZNC8MhquR4J1SoKN1rRjH3no",
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

  return (
    <form className="flex flex-col w-full">
      <div className="relative bg-white border-neutral-200 border flex items-stretch gap-5 text-base text-[rgba(147,147,147,1)] font-normal leading-loose justify-between mt-3 px-3.5 py-[18px] rounded-[15px] border-solid">
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
          className="bg-transparent outline-none w-full"
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
            className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto"
          >
            {searchResults.map((track) => (
              <div
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track);
                  setSearchInput(`${track.name} - ${track.artists[0].name}`);
                  setSearchResults([]);
                }}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
              >
                <img
                  src={track.album.images[2]?.url}
                  alt={track.name}
                  className="w-10 h-10 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">{track.name}</div>
                  <div className="text-sm text-gray-500">
                    {track.artists[0].name}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center p-2 text-gray-500">
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
          <h2 className="text-[rgba(52,75,103,1)] text-lg font-medium leading-[34px] text-center self-center mt-[17px]">
            {selectedTrack.name}
          </h2>
        ) : (
          <h2 className="text-[rgba(52,75,103,1)] text-lg font-medium leading-[34px] text-center self-center mt-[17px]">
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

      <p className="text-black text-xs font-normal leading-none text-center mt-[18px]">
        You will not be charged until your song is played.
      </p>

      <div className="flex flex-col items-center mt-4 fixed bottom-10 left-0 right-0">
        <button
          type="submit"
          className="bg-[rgba(86,105,255,1)] shadow-[0px_15px_25px_rgba(84,104,255,0.25)] self-center w-[185px] max-w-full text-base text-white font-bold text-center uppercase tracking-[1px] fill-[#5669FF] mt-[27px] px-[23px] py-[19px] rounded-[14px]"
        >
          Request now
        </button>
        <p className="bg-blend-normal text-[rgba(52,75,103,1)] text-base font-light leading-7 text-center self-center mt-[7px]">
          Select any song to request from the button above.
        </p>
      </div>
    </form>
  );
};
