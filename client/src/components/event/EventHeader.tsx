"use client";

import React from "react";
import { Button } from "../button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventHeaderProps {
  time?: string;
  title?: string;
  imageUrl: string;
}

const isValidImageUrl = (url: string) => {
  const pattern = /\.(jpg|jpeg|png|gif|webp)$/i;
  return pattern.test(url);
};

const EventHeader: React.FC<EventHeaderProps> = ({
  title = "Event Details",
  imageUrl = "",
}) => {
  const fallbackImageUrl = "/fallback.webp";
  const router = useRouter();
  const imageSrc = isValidImageUrl(imageUrl) ? imageUrl : fallbackImageUrl;

  return (
    <div className="relative w-full max-h-[100px] md:max-h-[100px] sm:max-h-[50px] aspect-[1.697] bg-gray-900">
      {/* Background Image */}
      <img
        src={imageSrc}
        onError={(e) => {
          e.currentTarget.src = fallbackImageUrl;
        }}
        className="absolute inset-0 h-full w-full object-cover"
        alt="Event background"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Content */}
      <div className="relative flex w-full flex-col items-stretch px-6 py-4">
        <div className="flex items-center justify-center relative w-full text-2xl text-white font-medium mt-4">
          {/* Back Button (keeps it on the left) */}
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

          {/* Centered Title */}
          <div className="flex-grow ml-20">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;
