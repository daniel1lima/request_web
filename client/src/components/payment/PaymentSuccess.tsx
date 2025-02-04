'use client'
import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess: React.FC = () => {
  const [ eventId, setEventId ] = useState('')

  useEffect(() => {
    setEventId(localStorage.getItem('eventId')!);
  }, );


  return (
    <div className="bg-gray-900 dark:bg-gray-900 flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl text-white font-bold mb-4 text-center">Congratulations!</h1>
      <h1 className="text-9xl text-white mb-4 mt-5">🥳</h1>
      <p className="text-gray-300 text-lg mb-6 text-center">Thank you for your payment. Your song request has been received.</p>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-4 w-full max-w-md">
        <h2 className="text-2xl text-yellow-400 font-semibold mb-4 flex items-center">
          <FaCheckCircle className="mr-2" /> Important Information:
        </h2>
        <ul className="list-disc list-inside text-gray-300 text-lg">
          <li className="mb-2 text-center">You will not be charged until your song request is played.</li>
          <li className="mb-2 text-center">Your song will not show up on the song queue until the DJ accepts the request. If your request is denied, you will not be charged.</li>
        </ul>
      </div>

      <a
        href={`/event?eventId=${eventId}`} // Direct link to the event page
        className="mt-6 bg-blue-500 text-white px-6 py-3 rounded-lg transition duration-200 hover:bg-blue-600 text-lg"
      >
        Return to Event
      </a>
    </div>
  );
};

export default PaymentSuccess;