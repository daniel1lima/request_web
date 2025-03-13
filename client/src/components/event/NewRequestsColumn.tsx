"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FaCheck, FaTimes } from "react-icons/fa";
import SongCard from "@/components/event/SongCard";
// Import the new class-based store hooks
import { useRequestStore } from "@/store/requestStore";
import { useAdminStore } from "@/store/adminStore"; 
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
// Import WebSocketService
import WebSocketService from "@/services/websocketService";

const NewRequestsColumn = () => {
  // Use the class-based stores
  const requestStore = useRequestStore();
  const adminStore = useAdminStore();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [noNewRequests, setNoNewRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // Fetch requests and set up WebSocket on component mount
  useEffect(() => {
    const eventId = localStorage.getItem("eventId");
    if (!eventId) {
      console.error("No eventId found in localStorage");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch requests for this event
        await requestStore.fetchRequests(eventId, true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up WebSocket connection
    const wsService = WebSocketService.getInstance();
    wsService.connect(eventId);
    setSocketConnected(wsService.isConnected());

    // Subscribe to request updates
    const unsubscribeNewRequest = wsService.subscribe("new_request", (data) => {
      console.log("New request received via WebSocket:", data);
      requestStore.fetchRequests(eventId, true);
    });

    const unsubscribeRequestUpdate = wsService.subscribe("request_update", (data) => {
      console.log("Request update received via WebSocket:", data);
      requestStore.fetchRequests(eventId, true);
    });

    // Check connection status periodically
    const connectionCheckInterval = setInterval(() => {
      const connected = wsService.isConnected();
      setSocketConnected(connected);
      
      if (!connected) {
        console.log("WebSocket disconnected, attempting to reconnect...");
        wsService.connect(eventId);
      }
    }, 5000);

    // Fallback polling for requests in case WebSocket fails
    const pollingInterval = setInterval(() => {
      if (!wsService.isConnected()) {
        console.log("Polling for requests as WebSocket is disconnected");
        requestStore.fetchRequests(eventId, true);
      }
    }, 10000);

    return () => {
      // Clean up subscriptions and intervals
      unsubscribeNewRequest();
      unsubscribeRequestUpdate();
      clearInterval(connectionCheckInterval);
      clearInterval(pollingInterval);
    };
  }, []);

  // Check if there are any new requests
  useEffect(() => {
    
    const pendingRequests = requestStore.requests.filter(
      req => req.status === "pending" || req.status === "declining"
    );
    
    setNoNewRequests(pendingRequests.length === 0);
  }, [requestStore.requests]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific request
      adminStore.setLoadingState(requestId, true);

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      // Find the request to update
      const requestToAccept = requestStore.requests.find(
        (req) => req.requestId === requestId
      );

      if (!requestToAccept) return;

      // Optimistic UI update - immediately update the request status
      const optimisticRequests = requestStore.requests.map((req) =>
        req.requestId === requestId
          ? { ...req, accepted: true, status: "accepted" }
          : req
      );
      requestStore.setRequests(optimisticRequests);

      // Now make the actual API call
      const success = await adminStore.acceptRequestFunc(requestId, accesstoken);

      // Clear loading state regardless of outcome
      adminStore.setLoadingState(requestId, false);

      if (!success) {
        throw new Error("Failed to accept request");
      }
    } catch (error) {
      // Clear loading state in case of error
      adminStore.setLoadingState(requestId, false);

      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    adminStore.setLoadingState(requestId, true);

    const accesstoken = await getToken();
    if (!accesstoken) throw new Error("Authentication token is missing.");

    // Find the request to decline
    const requestToDecline = requestStore.requests.find(
      (req) => req.requestId === requestId
    );

    if (!requestToDecline?.paymentId) return;

    // Optimistic UI update - immediately remove the request from the displayed list
    const optimisticRequests = requestStore.requests.map((req) =>
      req.requestId === requestId
        ? { ...req, status: "declined" }
        : req
    );

    // Update the request store with our optimistic data
    requestStore.setRequests(optimisticRequests);

    const success = await adminStore.declineRequest(
      requestId,
      accesstoken,
      requestToDecline.paymentId
    );

    adminStore.setLoadingState(requestId, false);

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

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-xl overflow-y-auto h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl overflow-y-auto h-full">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-white">
          New Requests {requestStore.requests.filter(req => req.status === "pending").length > 0 && 
            `(${requestStore.requests.filter(req => req.status === "pending").length})`}
        </h2>
        
        {/* WebSocket connection indicator */}
        <div className={`px-2 py-1 rounded-full flex items-center ${socketConnected ? "bg-green-500/20" : "bg-red-500/20"}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${socketConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-xs font-medium text-white">
            {socketConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>
      
      <AnimatePresence>
        {noNewRequests ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 text-gray-400"
          >
            No new requests waiting for approval
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
                .filter((req) => req.status === "pending")
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-3">
                        <motion.button
                          onClick={() => handleAcceptRequest(request.requestId)}
                          className="bg-gray-600 group-hover:bg-green-500 hover:!bg-green-600 p-3 rounded-full transition-colors"
                          disabled={adminStore.loadingStates[request.requestId]}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {adminStore.loadingStates[request.requestId] ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <FaCheck className="w-6 h-6 text-white" />
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeclineRequest(request.requestId)}
                          className="bg-gray-600 group-hover:bg-red-500 hover:!bg-red-600 p-3 rounded-full transition-colors"
                          disabled={adminStore.loadingStates[request.requestId]}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {adminStore.loadingStates[request.requestId] ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <FaTimes className="w-6 h-6 text-white" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              
              {/* Also show requests that are in the process of being declined */}
              {requestStore.requests
                .filter((req) => req.status === "declining")
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-3">
                        <div className="bg-gray-600 p-3 rounded-full">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      </div>
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

export default NewRequestsColumn; 