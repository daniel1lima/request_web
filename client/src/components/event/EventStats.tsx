"use client";
import { useEffect, useState } from "react";
import { useRequestStore } from "@/store/requestStore";
import { motion, AnimatePresence } from "framer-motion";

const EventStats = () => {
  const requestStore = useRequestStore();
  const [stats, setStats] = useState({
    totalRequests: 0,
    playedRequests: 0,
    earnings: 0,
  });

  useEffect(() => {
    setStats({
      totalRequests: requestStore.requests.length,
      playedRequests: requestStore.requests.filter(req => req.played).length,
      earnings: requestStore.requests
        .filter(req => req.played)
        .reduce((total, req) => total + (req.Payment?.amount || 0), 0) / 100,
    });
  }, [requestStore.requests]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  const numberVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { scale: 0.8, opacity: 0 }
  };

  return (
    <motion.div 
      className="grid grid-cols-3 gap-4 mb-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {/* Songs Requested Card */}
      <motion.div 
        className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between"
        variants={cardVariants}
      >
        <div>
          <h3 className="text-xl font-bold text-white">
            Songs Requested
          </h3>
        </div>
        <AnimatePresence mode="wait">
          <motion.p 
            key={stats.totalRequests}
            className="text-4xl font-semibold text-white"
            variants={numberVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {stats.totalRequests}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Songs Played Card */}
      <motion.div 
        className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between"
        variants={cardVariants}
      >
        <div>
          <h3 className="text-xl font-bold text-white">Songs Played</h3>
        </div>
        <AnimatePresence mode="wait">
          <motion.p 
            key={stats.playedRequests}
            className="text-4xl font-semibold text-white"
            variants={numberVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {stats.playedRequests}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* DJ Earnings Card */}
      <motion.div 
        className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between"
        variants={cardVariants}
      >
        <div>
          <h3 className="text-xl font-bold text-white">DJ Earnings</h3>
        </div>
        <AnimatePresence mode="wait">
          <motion.p 
            key={stats.earnings.toFixed(2)}
            className="text-4xl font-semibold text-white"
            variants={numberVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            ${stats.earnings.toFixed(2)}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default EventStats; 