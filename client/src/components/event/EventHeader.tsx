"use client";

import React from "react";
import { Button } from "../button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import DJProfile from "./DJprofile";
import DJ from "../../app/event/page";

interface EventHeaderProps {
  time?: string;
  title?: string;
  imageUrl: string;
  djData: DJ;
}

export interface DJ {
  djId: string;
  djName: string;
  djInsta?: string;
  djImageUrl: string;
}

const isValidImageUrl = (url: string) => {
  const pattern = /\.(jpg|jpeg|png|gif|webp)$/i;
  return pattern.test(url);
};

const EventHeader: React.FC<EventHeaderProps> = ({
  title = "Event Details",
  imageUrl = "",
  djData,
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
      <div className="relative flex w-full h-full items-center px-6">
        <div className="flex items-center w-full text-2xl text-white font-medium">
          {/* Back Button and Title Group */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="bg-slate-600"
              onClick={() => {
                router.push("/");
              }}
            >
              <ChevronLeft />
            </Button>
            <div className="text-white">{title}</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventHeader;
