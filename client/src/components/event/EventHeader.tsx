"use client";

import React from "react";
import { Button } from "../button";
import { ChevronLeft } from "lucide-react";

interface EventHeaderProps {
  time?: string;
  title?: string;
  imageUrl?: string;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  time = "9:41",
  title = "Event Details",
  imageUrl,
}) => {
  const fallbackImageUrl =
    "https://storage.googleapis.com/ubyssey/media/renditions/20230303_i_janmohamed_pit.width-1500.format-webp.webp";

  return (
    <div className="flex flex-col self-stretch relative aspect-[1.697] h-full w-full max-h-[200px]">
      <img
        loading="lazy"
        src={imageUrl}
        onError={(e) => {
          e.currentTarget.src = fallbackImageUrl;
        }} // Fallback on error
        className="absolute h-full w-full object-cover inset-0"
        alt="Event background"
      />
      <div className="relative flex mb-[-25px] w-full flex-col items-stretch px-6 py-4">
        <div className="flex items-stretch gap-[13px] text-2xl text-white font-medium mt-4">
          <Button variant="outline" size="icon">
            <ChevronLeft />
          </Button>
          <div className="basis-auto">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;
