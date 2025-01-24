import React from 'react';

import { SongForm } from './SongForm';
import { EmptyState } from './EmptyState';

export const RequestSong = () => {
  return (
    <div className="bg-white max-w-[480px] w-full h-screen overflow-auto ">
          <div className="flex flex-col w-full text-center pb-6 pt-6">
            <h1 className="relative text-black text-[25px] font-normal leading-none ">
              Request a Song
            </h1>
          </div>

          <div className="bg-white z-10 flex w-full flex-col items-stretch ">
            <div className="flex w-full flex-col items-stretch  px-3.5">
              <SongForm />
              <EmptyState />
            </div>
          </div>
      </div>

  );
};