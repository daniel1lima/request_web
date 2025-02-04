'use client'

import React, { useRef, useEffect, useState } from 'react';
import './songcard.css';



interface EventCardProps {
  image: string;
  title: string;
  fee: number;
  isQueued?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ image, title, fee}) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      setIsOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, [title]);

  return (
    <div className="bg-gray-800 hover:bg-slate-700 shadow-[0px_10px_35px_rgba(87,92,138,0.06)] flex items-stretch gap-5 justify-between px-2 py-1 rounded-2xl overflow-hidden ">
      <div className="flex items-stretch gap-[17px] ">
        <img
          loading="lazy"
          srcSet={image}
          className="object-cover w-[75px] h-[75px] shrink-0 border rounded-full max-w-full max-h-full"
          alt={title}
        />
        <div className="flex flex-col items-stretch mt-[9px] p-2 overflow-hidden">
          <div 
            ref={titleRef} 
            className={`text-gray-200 dark:text-gray-200 text-[15px] font-medium whitespace-nowrap cursor-pointer ${isOverflowing ? 'scroll-on-hover' : ''}`}
          >
            {title}
          </div>
          <div className="text-[#5669FF] dark:text-[rgba(63,56,221,1)] text-[13px] font-light mt-[5px] text-left">
            {fee}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default EventCard;