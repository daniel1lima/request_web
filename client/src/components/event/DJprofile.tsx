import React from 'react';

interface DJProfileProps {
  name: string;
  role: string;
  image: string;
}

const DJProfile: React.FC<DJProfileProps> = ({ name, role, image }) => {
  return (
    <div className="flex w-full max-w-[331px] items-stretch gap-5 font-light justify-between pt-6">
      <div className="flex items-stretch gap-[13px]">
        <img
          loading="lazy"
          srcSet={image}
          className="aspect-[1.02] object-contain w-[45px] shrink-0"
          alt={name}
        />
        <div className="flex flex-col items-stretch">
          <div className="bg-blend-normal text-[rgba(13,12,38,1)] text-[15px] leading-loose">
            {name}
          </div>
          <div className="bg-blend-normal text-[rgba(112,110,143,1)] text-xs">
            {role}
          </div>
        </div>
      </div>
      <button className="bg-[rgba(86,105,255,1)] shadow-[0px_8px_20px_rgba(74,210,228,0.082)] text-xs text-[#5669FF] whitespace-nowrap text-center my-auto px-3 py-[7px] rounded-[7px]">
        Follow
      </button>
    </div>
  );
};

export default DJProfile;