"use client"; // Add this line to mark the component as a Client Component


import {useEffect} from 'react'
import EmailForm from "@/components/EmailForm";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import Confetti from "react-confetti";

export default function Home() {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  useEffect(() => {
    // Disable scrolling on body when component mounts
    document.body.style.overflow = "hidden";

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <>
      {showConfetti && <Confetti />}
      <Toaster />

      <section className="w-screen h-dvh grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
        <div className="md:h-full h-80 bg-[#FCD0A1] relative overflow-hidden">
          <Image
            src="/mobile-app.png"
            alt="Mobile App Screenshots"
            fill
            className="object-contain object-bottom px-14 scale-110"
          />
        </div>

        <main className="flex flex-col gap-3 mt-3 justify-center items-center px-6 pb-10 bg-white">
          {/* <div className="flex justify-center mb-4">
            <Image
              src="/RequestLogoLight.png"
              alt="Request Logo"
              width={300}
              height={150}
              className="object-contain"
            />
          </div> */}
          <h1 className="font-semibold tracking-tight text-zinc-900 text-5xl leading-tight md:text-5xl max-w-lg text-center">
            🪩🎵🥳
          </h1>
          <h1 className="font-semibold tracking-tight text-zinc-900 text-3xl leading-tight md:text-4xl max-w-lg text-center">
            Be the DJ for a night: Secure your spot on future Request events!
          </h1>
          <h1 className="tracking-tight text-grey-200 text-xl leading-tight md:text-xl max-w-lg text-center text-slate-800"> 
            Join the waitlist to be notified when we launch and get your 
          </h1>
          <span 
            className="bg-yellow-200 border border-yellow-400 rounded-md px-2 py-1 font-semibold text-gray-800 text-lg cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-blue-800 hover:text-white" 
            onClick={handleClick}
          > 
            First Request FREE!
          </span>
          

          <div className="flex justify-center">
            <EmailForm />
          </div>

          <div className="flex items-start gap-2 text-gray-500 mt-2 text-center">
            <InfoCircledIcon />
            <p className="text-xs max-w-sm text-center">
              No worries! your data is completely safe and will only be utilized to
              provide you with updates about our product.
             </p>
          </div>
        </main>
      </section>
    </>
  );
}
