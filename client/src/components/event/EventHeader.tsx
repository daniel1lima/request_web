'use client'

import React from 'react';

interface EventHeaderProps {
  time?: string;
  title?: string;
}

const EventHeader: React.FC<EventHeaderProps> = ({ time = "9:41", title = "Event Details" }) => {
  return (
    <div className="flex flex-col self-stretch relative aspect-[1.697] h-full w-full">
      <img
        loading="lazy"
        srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=100 100w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=200 200w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=400 400w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=800 800w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/TEMP/dbf5ad3de51be0841efa30aaffae5d7a3a43b96467f3f39e7d0ca6ab0c1b7c81?placeholderIfAbsent=true"
        className="absolute h-full w-full object-cover inset-0"
        alt="Event background"
      />
      <div className="relative flex mb-[-25px] w-full flex-col items-stretch px-6 py-4">
        
        <div className="flex items-stretch gap-[13px] text-2xl text-white font-medium mt-4">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/022449ea0d22e808f2da674b06a33d692ed63357cc1a988c68bb8d7cf44fe76c?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-[22px] shrink-0 my-auto"
            alt="Back icon"
          />
          <div className="basis-auto">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;