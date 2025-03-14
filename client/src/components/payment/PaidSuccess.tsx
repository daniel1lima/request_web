"use client";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

const PaidSuccess: React.FC = () => {
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    setEventId(localStorage.getItem("eventId")!);
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="bg-gray-900 dark:bg-gray-900 flex flex-col items-center justify-start p-5">
      <h1 className="text-3xl text-white font-bold mb-4 text-center">
        Congratulations!
      </h1>
      <h1 className="text-7xl text-white mb-4 mt-2">🥳</h1>
      <p className="text-gray-300 text-md mb-6 text-center">
        Your song request has been received.
      </p>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-4 w-full max-w-md">
        <h2 className="text-2xl text-yellow-400 font-semibold mb-1 flex items-center justify-center text-center">
          <FaCheckCircle className="mr-2" /> Important Information
        </h2>
        <ul className="flex flex-col  text-gray-300 text-md p-3 gap-4">
          <li className="mb-2 text-center">
            <strong>You will not be charged</strong> until your song request is
            played.
          </li>
          <li className="mb-2 text-center">
            Your song will not show up on the song queue{" "}
            <strong>until the DJ accepts</strong> the request.
          </li>
          <li className="mb-2 text-center ">
            <strong>We reserve the right to deny your request</strong> if you
            approach the DJ.
          </li>
          <li className="mb-2 text-center text-red-400">
            To <strong>cancel your request</strong> check your text message
            confirmation
          </li>
        </ul>
      </div>

      <a
        href={`/event?eventId=${eventId}`} // Direct link to the event page
        className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg transition duration-200 hover:bg-blue-600 text-lg"
      >
        <span className="font-semibold">Return to Event</span>
      </a>
    </div>
  );
};

export default PaidSuccess;
