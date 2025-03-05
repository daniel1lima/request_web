"use client";

import React, { useRef, useEffect, useState } from "react";
import "./songcard.css";

interface SongCardProps {
  image: string;
  title: string;
  artist: string;
  reactions?: number;
  isQueued?: boolean;
  payment?: { amount: number } | null;
  isAdminView?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  image,
  title,
  artist,
  payment,
  isAdminView = false,
}) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      setIsOverflowing(
        titleRef.current.scrollWidth > titleRef.current.clientWidth
      );
    }
  }, [title]);

  return (
    <div className="bg-gray-800 dark:bg-gray-800 shadow-[0px_10px_35px_rgba(87,92,138,0.06)] flex items-stretch gap-5 justify-between px-2 py-1 rounded-2xl overflow-hidden w-full">
      <div className="flex items-center gap-[17px] w-full">
        <img
          loading="lazy"
          srcSet={image || '/RequestLogoDark.png'}
          className="object-cover w-[60px] ml-2 h-[60px] shrink-0 border sm:rounded-[2px] lg:rounded-[4px] max-w-full max-h-full items-center align-middle justify-center"
          alt={title}
        />
        <div className="flex flex-col items-stretch mt-[9px] p-2 overflow-hidden w-full">
          <div
            ref={titleRef}
            className={`text-gray-200 dark:text-gray-200 text-[15px] font-medium whitespace-nowrap cursor-default ${isOverflowing ? "scroll-on-hover" : ""}`}
          >
            {title}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[#5669FF] dark:text-[rgba(63,56,221,1)] text-[13px] font-light mt-[5px] text-left">
              {artist}
            </div>
            {payment && isAdminView && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  !payment.amount || payment.amount === 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {!payment.amount || payment.amount === 0
                  ? "FREE"
                  : `$${(payment.amount / 100).toFixed(2)}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongCard;
