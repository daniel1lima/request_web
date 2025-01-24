import React from 'react';

export const SongForm = () => {
  return (
    <form className="flex flex-col w-full">

      <div className="bg-white border-neutral-200 border flex items-stretch gap-5 text-base text-[rgba(147,147,147,1)] font-normal leading-loose justify-between mt-3 px-3.5 py-[18px] rounded-[15px] border-solid">
        <input
          id="song-input"
          type="text"
          placeholder="Enter Song Here"
          className="bg-transparent outline-none w-full"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/75942211a1544d86b498ed7135a3be3b/2ec281e05b09d0a0c83cd8a69a7e7f1c271c22d87923a616cd20dfffcdf62a84?placeholderIfAbsent=true"
          className="aspect-[0.64] object-contain w-[7px] stroke-[2px] stroke-[#5669FF] shrink-0 my-auto"
          alt="Search icon"
        />
      </div>

      <div className="flex items-stretch gap-5 leading-[34px] justify-between mt-[47px]">
        <div className="text-[#120D26] text-base font-medium">
          Current Request Fee
        </div>
        <div className="text-[rgba(63,56,221,1)] text-lg font-bold text-right">
          24.99 AED
        </div>
      </div>

      <p className="text-black text-xs font-normal leading-none ml-[26px] mr-[23px] mt-[18px]">
        You will not be charged until your song is played.
      </p>

      <button
        type="submit"
        className="bg-[rgba(86,105,255,1)] shadow-[0px_15px_25px_rgba(84,104,255,0.25)] self-center w-[185px] max-w-full text-base text-white font-bold text-center uppercase tracking-[1px] fill-[#5669FF] mt-[27px] px-[23px] py-[19px] rounded-[14px]"
      >
        Request now
      </button>
    </form>
  );
};