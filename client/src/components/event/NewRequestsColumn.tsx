"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FaCheck, FaTimes } from "react-icons/fa";
import SongCard from "@/components/event/SongCard";
import useRequestStore from "@/store/requestStore";
import useAdminStore from "@/store/adminStore";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";

const NewRequestsColumn = () => {
  const { requests: songRequests, setRequests } = useRequestStore();
  const { loadingStates, setLoadingState, acceptRequestFunc, declineRequest } = useAdminStore();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [noNewRequests, setNoNewRequests] = useState(false);

  // Check if there are any new requests
  useEffect(() => {
    const pendingRequests = songRequests.filter(
      req => req.status === "pending" || req.status === "declining"
    );
    setNoNewRequests(pendingRequests.length === 0);
  }, [songRequests]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific request
      setLoadingState(requestId, true);

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      // Find the request to update
      const requestToAccept = songRequests.find(
        (req) => req.requestId === requestId
      );

      if (!requestToAccept) return;

      // Optimistic UI update - immediately update the request status
      const optimisticRequests = songRequests.map((req) =>
        req.requestId === requestId
          ? { ...req, accepted: true, status: "accepted" }
          : req
      );
      setRequests(optimisticRequests);

      // Now make the actual API call
      const success = await acceptRequestFunc(requestId, accesstoken);

      // Clear loading state regardless of outcome
      setLoadingState(requestId, false);

      if (!success) {
        throw new Error("Failed to accept request");
      }
    } catch (error) {
      // Clear loading state in case of error
      setLoadingState(requestId, false);

      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setLoadingState(requestId, true);

    const accesstoken = await getToken();
    if (!accesstoken) throw new Error("Authentication token is missing.");

    // Find the request to decline
    const requestToDecline = songRequests.find(
      (req) => req.requestId === requestId
    );

    if (!requestToDecline?.paymentId) return;

    // Optimistic UI update - immediately remove the request from the displayed list
    const optimisticRequests = songRequests.map((req) =>
      req.requestId === requestId
        ? { ...req, status: "declined" }
        : req
    );

    // Update the request store with our optimistic data
    setRequests(optimisticRequests);

    const success = await declineRequest(
      requestId,
      accesstoken,
      requestToDecline.paymentId
    );

    setLoadingState(requestId, false);

    if (success) {
      toast({
        title: "Request declined",
        description: "The request was declined.",
        duration: 2000,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
        New Requests
      </h2>
      <div className="space-y-4">
        {songRequests
          .filter((req) => req.status === "pending")
          .map((request) => (
            <div
              key={request.requestId}
              className={`bg-gray-700 rounded-lg p-4 relative group 
                transition-all duration-300 ease-in-out
                ${loadingStates[request.requestId] ? "opacity-70" : "hover:shadow-lg"}`}
            >
              <div className="flex items-center space-x-4 w-[300px]">
                <SongCard
                  image={request.songImage}
                  title={request.songName}
                  artist={request.songArtist}
                  reactions={request.requestUpvotes}
                  payment={request.Payment}
                  isAdminView={true}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-3">
                  <button
                    onClick={() => handleAcceptRequest(request.requestId)}
                    className="bg-gray-600 group-hover:bg-green-500 hover:!bg-green-600 p-3 rounded-full transition-colors"
                    disabled={loadingStates[request.requestId]}
                  >
                    {loadingStates[request.requestId] ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <FaCheck className="w-6 h-6 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(request.requestId)}
                    className="bg-gray-600 group-hover:bg-red-500 hover:!bg-red-600 p-3 rounded-full transition-colors"
                    disabled={loadingStates[request.requestId]}
                  >
                    {loadingStates[request.requestId] ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <FaTimes className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        {/* Also show requests that are in the process of being declined */}
        {songRequests
          .filter((req) => req.status === "declining")
          .map((request) => (
            <div
              key={request.requestId}
              className={`bg-gray-700 rounded-lg p-4 relative group 
                transition-all duration-300 ease-in-out
                ${loadingStates[request.requestId] ? "opacity-70" : "hover:shadow-lg"}`}
            >
              <div className="flex items-center space-x-4 w-[300px]">
                <SongCard
                  image={request.songImage}
                  title={request.songName}
                  artist={request.songArtist}
                  reactions={request.requestUpvotes}
                  payment={request.Payment}
                  isAdminView={true}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-3">
                  <div className="bg-gray-600 p-3 rounded-full">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        {noNewRequests && (
          <div className="text-center py-8 text-gray-400">
            No new requests waiting for approval
          </div>
        )}
      </div>
    </div>
  );
};

export default NewRequestsColumn; 