'use client'

import React, { useRef, useEffect, useState } from 'react';
import './songcard.css';
import Image from 'next/image';



interface EventCardProps {
  image: string;
  title: string;
  date: Date;
  location: string;
  isQueued?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ image, title, date, location }) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      setIsOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, [title]);

  return (
    <div className="bg-gray-800 hover:bg-slate-700 shadow-[0px_10px_35px_rgba(87,92,138,0.06)] rounded-lg overflow-hidden flex flex-col items-center p-4">
      <img
        loading="lazy"
        srcSet={image}
        className="object-cover w-full h-32 rounded-t-lg"
        alt={title}
      />
      <div className="flex flex-col items-center mt-2">
        <div 
          ref={titleRef} 
          className={`text-gray-200 dark:text-gray-200 text-[16px] font-medium text-center`}
        >
          {title}
        </div>
        <div className="text-[#5669FF] dark:text-[rgba(63,56,221,1)] text-[14px] font-light mt-[5px] text-center">
          {location}
        </div>
        <div className="text-gray-400 text-[14px] font-light mt-[5px] text-center">
          {date}
        </div>
      </div>
    </div>
  );
};

export default EventCard;