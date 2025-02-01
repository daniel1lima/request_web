"use client";
import React, { useEffect, useState } from "react";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import { FaCheck, FaTimes } from "react-icons/fa";

export interface request {
  requestId: number;
  songImage: string;
  songName: string;
  songArtist: string;
  requestUpvotes: number;
  accepted: boolean;
  paymentId?: string;
  played: boolean;
}

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
    <div className="loader text-white">Loading...</div>
  </div>
);

const EventAdminPage = () => {
  const [songRequests, setSongRequests] = useState<request[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to accept a song request
  const acceptRequest = (requestId: number) => {
    // Make a fetch call to accept the song request
    fetch(`api/requests/accept?requestId=${requestId}`, {
      method: 'PUT',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        // Update the state to mark the request as accepted
        setSongRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.requestId === requestId ? { ...req, accepted: true } : req
          )
        );
      })
      .catch((error) => {
        console.log("Error accepting request:", error);
      });
  };

  const playedRequest = (requestId: string) => {
    // Find the request object by requestId
    const request = songRequests.find(req => req.requestId === requestId);
    
    if (!request || !request.paymentId) {
      console.log("Request or paymentId not found");
      return;
    }

    // Fetch the payment data using the paymentId from the request
    fetch(`api/payment/${request.paymentId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch payment data');
        }
        return response.json();
      })
      .then((paymentData) => {
        const { amount } = paymentData; // Extract amount from the response

        // Capture the payment intent using the paymentId and amount
        return fetch(`api/stripe/capturePaymentIntent?intentId=${request.paymentId}&capture=${amount}`, {
          method: 'POST',
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to capture payment intent');
        }
        return response.json();
      })
      .then((captureData) => {
        console.log('Payment captured successfully:', captureData);
        
        // Set the song to played
        return fetch(`api/requests/played?requestId=${requestId}`, {
          method: 'PUT', // Assuming POST is the correct method
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to mark request as played');
        }
        console.log('Song marked as played successfully');

        setSongRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.requestId === requestId ? { ...req, played: true } : req
          )
        );


      })
      .catch((error) => {
        console.log("Error processing payment:", error);
      });
  };

  // Function to decline a song request
  const declineRequest = (requestId: number) => {
    // Make a fetch call to delete the request from the server
    fetch(`api/requests/delete?requestId=${requestId}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        // Update the state to remove the declined request
        setSongRequests((prevRequests) =>
          prevRequests.filter((req) => req.requestId !== requestId)
        );
      })
      .catch((error) => {
        console.log("Error deleting request:", error);
      });
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const eventId = url.searchParams.get("eventId");

    if (!eventId) {
      console.log("Event ID not found in URL");
      return;
    }

    // Fetch song requests
    fetch(`api/requests/getByEvent?eventId=${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSongRequests(data);
        } else {
          console.log("Fetched data is not an array:", data);
          setSongRequests([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.log("Error fetching initial requests:", error);
        setLoading(false);
      });

    localStorage.setItem("eventId", eventId);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="bg-gray-900 dark:bg-gray-900 flex w-screen h-screen flex-col overflow-y-auto overflow-x-hidden items-center mx-auto">
      <div className="flex flex-col items-center w-full px-4 pb-20">
        <DJProfile
          name="DJ Zo"
          role="Main Event DJ"
          image="https://cdn.builder.io/api/v1/image/assets/TEMP/07768e6beee3d7f47f88d0798e6e2e885f8e8b62f39f33f7eac92fdf4c2d3eeb?placeholderIfAbsent=true"
        />

        <div className="flex flex-row w-screen h-screen justify-center gap-[25%] text-center">
          <div className="w-[300px] gap-4">
            <h2 className="text-gray-200 dark:text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px] min-w-[200px]">
              Accepted
            </h2>
            {songRequests
              .filter((req) => req.accepted && !req.played)
              .map((request) => (
                <div className="mb-4 w-inherit overflow-clip" key={request.requestId}>
                  <SongCard
                    image={request.songImage}
                    title={request.songName}
                    artist={request.songArtist}
                    reactions={request.requestUpvotes}
                  />
                  <button
                    onClick={() => playedRequest(request.requestId.toString())}
                    className="mr-2 text-green-500 mt-3"
                  >
                    <FaCheck className="w-5 h-5"/>
                  </button>
                </div>
              ))}
          </div>

          <div className="w-[300px] gap-4">
            <h2 className="text-gray-200 dark:text-gray-200 text-lg font-medium leading-[34px] opacity-[0.84] mt-[21px]">
              Requested
            </h2>
            {songRequests
              .filter((req) => !req.accepted && !req.played)
              .map((request) => (
                <div className="mb-4" key={request.requestId}>
                  <SongCard
                    image={request.songImage}
                    title={request.songName}
                    artist={request.songArtist}
                    reactions={request.requestUpvotes}
                  />

                  <div className="mt-3">
                  <button
                    onClick={() => acceptRequest(request.requestId)}
                    className="mr-2 text-green-500"
                  >
                    <FaCheck className="w-5 h-5"/>
                  </button>
                  <button
                    onClick={() => declineRequest(request.requestId)}
                    className="text-red-500"
                  >
                    <FaTimes className=" w-5 h-5 text-red-600 hover:text-red-300 transition-colors" />
                  </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* <div className="bg-gray-900 dark:bg-gray-900 flex flex-col gap-[13px] w-[80%] pt-5">
          {songRequests && songRequests.map((request) => (
            <SongCard
              key={request.requestId}
              image={request.songImage}
              title={request.songName}
              artist={request.songArtist}
              reactions={request.requestUpvotes}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default EventAdminPage;
