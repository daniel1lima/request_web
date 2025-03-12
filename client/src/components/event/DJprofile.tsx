import React from "react";
import { FaInstagram } from "react-icons/fa";
import { Button } from "../button";

interface DJProfileProps {
  name: string;
  role: string;
  image: string;
  insta: string;
  disableInsta?: boolean;
}

const DJProfile: React.FC<DJProfileProps> = ({ name, role, image, insta, disableInsta = false }) => {
  return (
    <div className="flex w-full max-w-[300px]  gap-5 font-light items-center justify-center pt-2">
      <div className="flex items-stretch gap-[20px]">
        <img
          loading="lazy"
          srcSet={image}
          className="aspect-[1.02] object-cover w-[45px] h-[45px] shrink-0 rounded-full overflow-hidden"
          alt={name}
        />
        <div className="flex flex-col items-stretch mb-2">
          <div className="bg-blend-normal text-white text-[rgba(13,12,38,1)] text-[15px] leading-loose">
            {name}
          </div>
          <div className="bg-blend-normal text-[rgba(112,110,143,1)] text-xs">
            {role}
          </div>
        </div>
        {insta && !disableInsta && (
          <div className="flex flex-row gap-3">
            <Button variant={"default"} className="bg-[rgba(86,105,255,1)] hover:bg-[rgba(86,105,255,1)] shadow-[0px_8px_20px_rgba(74,210,228,0.082)] text-xs text-white whitespace-nowrap hover:outline text-center my-auto px-3 py-[7px] rounded-[7px]" onClick={() => {window.open(insta, 'instagram.com')}}>
              <FaInstagram />
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};

export default DJProfile;
