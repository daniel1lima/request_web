import { Button } from "@/components/button";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";

const NotFound: React.FC = () => {

  return (
    <div className="bg-gray-900 dark:bg-gray-900 w-screen h-screen flex flex-col gap-10 items-center justify-center text-center">
      <Image
        src="/RequestLogoLight.png"
        alt="DJ Request Logo"
        width={200}
        height={200}
        className="invert dark:invert"
        priority
        style={{ objectFit: "contain" }}
      />
      <p className="text-xl">The page you're looking for doesn't exist!</p>
      <Link href='/'>
        <Button>
          <ChevronLeft />
          Take me back
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
