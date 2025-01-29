import React from "react";
import EventHeader from "@/components/event/EventHeader";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import RequestButton from "@/components/event/RequestButton";
import { NavigateAction } from "next/dist/client/components/router-reducer/router-reducer-types";
import Link from "next/link";

const Index = () => {
  return (
    <div className="bg-gray-800 dark:bg-gray-800 flex max-w-[480px] w-full h-screen flex-col overflow-y-auto items-center mx-auto">
      <EventHeader />

      <div className="flex flex-col items-center w-full px-4 pb-20">
        <DJProfile
          name="DJ Zo"
          role="Main Event DJ"
          image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
        />

        <h2 className="text-gray-200 dark:text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
          Song Queue
        </h2>

        <div className="bg-gray-800 dark:bg-gray-800 flex flex-col gap-[13px] w-[80%]">
          <SongCard
            image=""
            title="Healing"
            artist="Drake, Gordo"
            reactions={10}
          />

          <SongCard
            image=""
            title="Sauti"
            artist="Francis Mercier"
            reactions={12}
          />

          <SongCard image="" title="Move" artist="Keinemusik" reactions={24} />

          <SongCard image="" title="Open This Wall" artist="Berlioz" isQueued />
          <SongCard image="" title="Open This Wall" artist="Berlioz" isQueued />
          <SongCard image="" title="Open This Wall" artist="Berlioz" isQueued />
          <SongCard image="" title="Open This Wall" artist="Berlioz" isQueued />

          <SongCard
            image=""
            title="Celebration"
            artist="Supermini, Frankie Romano"
            isQueued
          />
        </div>
      </div>

      <div className="fixed bottom-0 w-full max-w-[480px] bg-transparent pb-4">
        <div className="self-stretch w-full text-base text-white font-bold text-center uppercase tracking-[1px] mt-[60px] pt-[9px] pb-5 px-[52px] bg-transparent">
          <Link href="/request-song">
            <button className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] shadow-[0px_10px_35px_rgba(111,126,201,0.25)] fill-[#5669FF] w-full px-[43px] py-[19px] rounded-[15px]">
              Request a song
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
