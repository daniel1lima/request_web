'use client'

import React, { useRef, useEffect, useState } from 'react';
import './songcard.css';



interface SongCardProps {
  image: string;
  title: string;
  artist: string;
  reactions?: number;
  isQueued?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({ image, title, artist}) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      setIsOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, [title]);

  return (
    <div className="bg-gray-800 dark:bg-gray-800 shadow-[0px_10px_35px_rgba(87,92,138,0.06)] flex items-stretch gap-5 justify-between px-2 py-1 rounded-2xl overflow-hidden">
      <div className="flex items-stretch gap-[17px]">
        <img
          loading="lazy"
          srcSet={image}
          className="object-cover w-[70px] h-[70px] shrink-0 border rounded-full max-w-full max-h-full"
          alt={title}
        />
        <div className="flex flex-col items-stretch mt-[9px] p-2 overflow-hidden">
          <div 
            ref={titleRef} 
            className={`text-gray-200 dark:text-gray-200 text-[15px] font-medium whitespace-nowrap cursor-default ${isOverflowing ? 'scroll-on-hover' : ''}`}
          >
            {title}
          </div>
          <div className="text-[#5669FF] dark:text-[rgba(63,56,221,1)] text-[13px] font-light mt-[5px] text-left">
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