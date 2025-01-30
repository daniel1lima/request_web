'use client'

import React from 'react';

interface SongCardProps {
  image: string;
  title: string;
  artist: string;
  reactions?: number;
  isQueued?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({ image, title, artist, reactions, isQueued = false }) => {
  return (
    <div className="bg-gray-800 dark:bg-gray-800 shadow-[0px_10px_35px_rgba(87,92,138,0.06)] flex items-stretch gap-5 justify-between px-2 py-1 rounded-2xl">
      <div className="flex items-stretch gap-[17px]">
        <img
          loading="lazy"
          srcSet={image}
          className="aspect-[1.8] object-contain w-[79px] shrink-0 rounded-[0px_0px_0px_0px]"
          alt={title}
        />
        <div className="flex flex-col items-stretch mt-[9px]">
          <div className="text-gray-200 dark:text-gray-200 text-[15px] font-medium">
            {title}
          </div>
          <div className="text-[#5669FF] dark:text-[rgba(63,56,221,1)] text-[13px] font-light mt-[7px]">
            {artist}
          </div>
        </div>
      </div>
      {/* {isQueued ? (
        <div className="text-[rgba(155,155,155,1)] dark:text-gray-400 text-xl mt-3.5">
          +
        </div>
      ) : (
        <div className="text-gray-200 dark:text-gray-200 text-[15px] font-medium mt-3.5">
          😍
          <br />
          <span className="text-[rgba(147,147,147,1)] dark:text-gray-400 text-[10px]"> {reactions}</span>
        </div>
      )} */}
    </div>
  );
};

export default SongCard;