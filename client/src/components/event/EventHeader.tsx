"use client";

import React from "react";
import { Button } from "../button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface EventHeaderProps {
  time?: string;
  title?: string;
  imageUrl: string;
}

const isValidImageUrl = (url: string) => {
  const pattern = /\.(jpg|jpeg|png|gif|webp)$/i;
  return true
  return pattern.test(url);
};

const EventHeader: React.FC<EventHeaderProps> = ({
  title = "Event Details",
  imageUrl = '',
}) => {
  const fallbackImageUrl =
    "/fallback.webp";

  const router = useRouter()

  const imageSrc = isValidImageUrl(imageUrl) ? imageUrl : fallbackImageUrl;

  return (
    <div className="flex flex-col self-stretch relative aspect-[1.697] w-full max-h-[100px] md:max-h-[100px] sm:max-h-[50px] bg-gray-900 bg-opacity-80">
      <img
        src={imageSrc}
        onError={(e) => {
          e.currentTarget.src = fallbackImageUrl;
        }}
        className="absolute h-full w-full object-cover inset-0"
        alt="Event background"
      />
      
      <div className="relative flex mb-[-25px] w-full flex-col items-stretch px-6 py-4">
        <div className="flex items-stretch gap-[13px] text-2xl text-white font-medium mt-4">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-6 bg-slate-600"
            onClick={() => {
              router.push("/");
            }}
          >
            <ChevronLeft />
          </Button>

          <div className="basis-auto absolute left-20 ">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;
