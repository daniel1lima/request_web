"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SongCard from "@/components/event/SongCard";
import { useRequestStore } from "@/store/requestStore";
import { ChevronDown } from "lucide-react";

// Connection status indicator component
const ConnectionStatus = ({ connected }: { connected: boolean }) => (
  <div
    className={`px-2 py-1 rounded-full flex items-center top-2 right-2 ${connected ? "bg-green-500/20" : "bg-red-500/20"}`}
  >
    <div
      className={`w-2 h-2 rounded-full mr-2 ${connected ? "bg-green-500" : "bg-red-500"}`}
    ></div>
    <span className="text-xs font-medium">
      {connected ? "Live" : "Offline"}
    </span>
  </div>
);

const AcceptedSongQueue = () => {
  const requestStore = useRequestStore();
  
  // Set up auto-refresh interval
  useEffect(() => {
    // Initial refresh
    requestStore.refreshRequests();
    
    // Set up interval for every 10 seconds
    const intervalId = setInterval(() => {
      requestStore.refreshRequests();
    }, 10000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [requestStore]);
  
  // Animation variants for song cards
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <>
      
      {requestStore.requests.filter(request => !request.played && request.status === "accepted").length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >

          <h3 className="text-xl font-medium text-white mb-2 mt-20">No Songs Accepted Yet</h3>
          <p className="text-gray-400">Request a song now!</p>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="text-gray-400 mt-2" size={30} color="white" />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="gap-[13px] w-full pt-5 mb-6 overflow-y-auto flex-1 scrollbar max-h-[500px]"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {requestStore.requests
              .filter(
                (request) =>
                  !request.played && request.status === "accepted"
              )
              .map((request) => (
                <motion.div
                  className="pb-3 mr-2"
                  key={request.requestId}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                >
                  <SongCard
                    image={request.songImage}
                    title={request.songName}
                    artist={request.songArtist}
                    reactions={request.requestUpvotes}
                    payment={request.Payment}
                    isAdminView={false}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
};

export default AcceptedSongQueue; 