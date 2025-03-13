"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FaCheck } from "react-icons/fa";
import SongCard from "@/components/event/SongCard";
import { useRequestStore } from "@/store/requestStore";
import { useAdminStore } from "@/store/adminStore";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const AcceptedSongsColumn = () => {
  const requestStore = useRequestStore();
  const adminStore = useAdminStore();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [noAcceptedRequests, setNoAcceptedRequests] = useState(false);

  // Check if there are any accepted requests
  useEffect(() => {
    const acceptedRequests = requestStore.requests.filter(
      req => req.accepted && !req.played && req.status === "accepted"
    );
    setNoAcceptedRequests(acceptedRequests.length === 0);
  }, [requestStore.requests]);

  const handlePlayedRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific request
      adminStore.setLoadingState(requestId, true);
      
      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");
      
      // Find the request to update
      const requestToPlay = requestStore.requests.find(
        (req) => req.requestId === requestId
      );
      if (!requestToPlay) return;

      // Optimistic UI update - immediately update the request status
      const optimisticRequests = requestStore.requests.map((req) =>
        req.requestId === requestId
          ? { ...req, played: true, status: "played" }
          : req
      );

      // Update the request store with our optimistic data
      requestStore.setRequests(optimisticRequests);

      // Now make the actual API call
      const success = await adminStore.playedRequest(requestId, accesstoken, requestStore.requests);

      // Clear loading state regardless of outcome
      adminStore.setLoadingState(requestId, false);

      toast({
        title: "Success",
        description: "The request was marked as played",
        variant: "default",
        duration: 2000,
      });

      if (!success) {
        throw new Error("Failed to mark request as played");
      }
    } catch (error) {
      // Clear loading state in case of error
      adminStore.setLoadingState(requestId, false);

      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to mark request as played",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 0.2 
      } 
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl overflow-y-auto h-full">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
        Accepted Requests
      </h2>
      
      <AnimatePresence>
        {noAcceptedRequests ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 text-gray-400"
          >
            No accepted requests waiting to be played
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {requestStore.requests
                .filter(
                  (req) =>
                    req.accepted && !req.played && req.status === "accepted"
                )
                .map((request) => (
                  <motion.div
                    key={request.requestId}
                    className={`bg-gray-700 rounded-lg p-4 relative group 
                      transition-all duration-300 ease-in-out
                      ${adminStore.loadingStates[request.requestId] ? "opacity-70" : "hover:shadow-lg"}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layout
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
                      <button
                        onClick={() => handlePlayedRequest(request.requestId)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-600 group-hover:bg-green-500 hover:!bg-green-600 p-3 rounded-full transition-colors"
                        disabled={adminStore.loadingStates[request.requestId]}
                      >
                        {adminStore.loadingStates[request.requestId] ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <FaCheck className="w-6 h-6 text-white" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AcceptedSongsColumn; 