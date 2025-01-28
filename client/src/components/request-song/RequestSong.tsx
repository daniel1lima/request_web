import React from 'react';

import { SongForm } from './SongForm';
import { EmptyState } from './EmptyState';

export const RequestSong = () => {
  return (
    <div className="bg-white max-w-[480px] w-full h-screen overflow-auto ">
          <div className="flex flex-col w-full text-center pb-3 pt-6">
            <h1 className="relative text-transparent text-[25px] font-normal leading-none bg-gradient-to-r from-red-500 to-blue-300 bg-clip-text leading-[1.2]">
              Request a Song
            </h1>
          </div>

          <div className="bg-white z-10 flex w-full flex-col items-stretch ">
            <div className="flex w-full flex-col items-stretch  px-3.5">
              <SongForm />
            </div>
          </div>
      </div>

  );
};