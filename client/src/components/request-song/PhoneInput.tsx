import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhoneInputProps {
  phone: string;
  setPhone: (phone: string) => void;
  phoneError: string;
  setPhoneError: (error: string) => void;
  setPhoneLoading: (loading: boolean) => void;
  countryCode: string;
  setCountryCode: (code: string) => void;
  selectedCountryFlag: React.ReactNode;
  setSelectedCountryFlag: (flag: React.ReactNode) => void;
  onSubmit: (formattedPhone: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const formatPhoneNumber = (value: string): string => {
  if (!value) return "";
  
  // Clean the input to only contain digits
  const phoneNumber = value.replace(/\D/g, "");
  
  // Format based on the length of the input
  if (phoneNumber.length < 4) {
    return phoneNumber;
  } else if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  phone,
  setPhone,
  phoneError,
  setPhoneError,
  setPhoneLoading,
  countryCode,
  setCountryCode,
  selectedCountryFlag,
  setSelectedCountryFlag,
  onSubmit,
  onBack,
  isLoading
}) => {
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Animation variants for different elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 20 
      }
    }
  };

  return (
    <motion.div 
      className="flex flex-col gap-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatePresence>
        {phoneError && (
          <motion.p 
            className="text-red-500 text-sm text-center transition-opacity duration-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {phoneError}
          </motion.p>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="flex items-center"
        variants={itemVariants}
      >
        <motion.button
          type="button"
          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
          className="shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center 
            text-gray-900 bg-gray-700 border border-gray-600 rounded-s-lg hover:bg-gray-600
            dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
          variants={buttonVariants}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {selectedCountryFlag}
          {countryCode}{" "}
          <svg
            className="w-2.5 h-2.5 ms-2.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </motion.button>

        <AnimatePresence>
          {showCountryDropdown && (
            <motion.div 
              className="absolute z-20 mt-1 top-[50px] bg-gray-800 divide-y divide-gray-700 rounded-lg shadow-lg w-52"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ul
                className="py-2 text-sm text-gray-200 max-h-[200px] overflow-y-auto"
                aria-labelledby="dropdown-phone-button"
              >
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    onClick={() => {
                      setCountryCode("+1");
                      setSelectedCountryFlag(
                        <svg
                          className="h-4 w-4 me-2"
                          fill="none"
                          viewBox="0 0 20 15"
                        >
                          <rect
                            width="19.6"
                            height="14"
                            y=".5"
                            fill="#fff"
                            rx="2"
                          />
                          <mask
                            id="ca"
                            style={{ maskType: "luminance" }}
                            width="20"
                            height="15"
                            x="0"
                            y="0"
                            maskUnits="userSpaceOnUse"
                          >
                            <rect
                              width="19.6"
                              height="14"
                              y=".5"
                              fill="#fff"
                              rx="2"
                            />
                          </mask>
                          <g mask="url(#ca)">
                            <path
                              fill="#fff"
                              d="M0 .5h19.6v14H0z"
                            />
                            <path
                              fill="#FF3131"
                              d="M13.867.5H19.6v14h-5.733zM0 .5h5.733v14H0z"
                            />
                            <path
                              fill="#FF3131"
                              d="M8.4 4.167l-.933 1.866s-.467.934.466.934c.934 0 .467-.934.467-.934s.467.934 1.4.934c.934 0 0-1.4 0-1.4l.467-1.4L8.4 4.167z"
                            />
                            <path
                              fill="#FF3131"
                              d="M11.2 8.9L9.8 7.5l1.4-1.4-1.4-.467-.467-1.4-.933 1.4L7 5.167 7.467 7 7 7.5l1.4 1.4-.467 1.4 1.4-.467.933.934v.933h.467v-.933l.467-.867z"
                            />
                          </g>
                        </svg>
                      );
                      setShowCountryDropdown(false);
                    }}
                  >
                    <span className="inline-flex items-center">
                      <svg
                        className="h-4 w-4 me-2"
                        fill="none"
                        viewBox="0 0 20 15"
                      >
                        <rect
                          width="19.6"
                          height="14"
                          y=".5"
                          fill="#fff"
                          rx="2"
                        />
                        <mask
                          id="ca"
                          style={{ maskType: "luminance" }}
                          width="20"
                          height="15"
                          x="0"
                          y="0"
                          maskUnits="userSpaceOnUse"
                        >
                          <rect
                            width="19.6"
                            height="14"
                            y=".5"
                            fill="#fff"
                            rx="2"
                          />
                        </mask>
                        <g mask="url(#ca)">
                          <path
                            fill="#fff"
                            d="M0 .5h19.6v14H0z"
                          />
                          <path
                            fill="#FF3131"
                            d="M13.867.5H19.6v14h-5.733zM0 .5h5.733v14H0z"
                          />
                          <path
                            fill="#FF3131"
                            d="M8.4 4.167l-.933 1.866s-.467.934.466.934c.934 0 .467-.934.467-.934s.467.934 1.4.934c.934 0 0-1.4 0-1.4l.467-1.4L8.4 4.167z"
                          />
                          <path
                            fill="#FF3131"
                            d="M11.2 8.9L9.8 7.5l1.4-1.4-1.4-.467-.467-1.4-.933 1.4L7 5.167 7.467 7 7 7.5l1.4 1.4-.467 1.4 1.4-.467.933.934v.933h.467v-.933l.467-.867z"
                          />
                        </g>
                      </svg>
                      Canada (+1)
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    onClick={() => {
                      setCountryCode("+44");
                      setSelectedCountryFlag(
                        <svg
                          className="h-4 w-4 me-2"
                          fill="none"
                          viewBox="0 0 20 15"
                        >
                          <rect
                            width="19.6"
                            height="14"
                            y=".5"
                            fill="#fff"
                            rx="2"
                          />
                          <mask
                            id="uk"
                            style={{ maskType: "luminance" }}
                            width="20"
                            height="15"
                            x="0"
                            y="0"
                            maskUnits="userSpaceOnUse"
                          >
                            <rect
                              width="19.6"
                              height="14"
                              y=".5"
                              fill="#fff"
                              rx="2"
                            />
                          </mask>
                          <g mask="url(#uk)">
                            <path
                              fill="#0A17A7"
                              d="M0 .5h19.6v14H0z"
                            />
                            <path
                              fill="#fff"
                              fillRule="evenodd"
                              d="M-.898-.842L7.467 4.8V-.433h4.667V4.8l8.364-5.642L21.542.706l-6.614 4.46H19.6v4.667h-4.672l6.614 4.46-1.044 1.549-8.365-5.642v5.233H7.467V10.2l-8.365 5.642-1.043-1.548 6.613-4.46H0V5.166h4.672L-1.941.706-.898-.842z"
                              clipRule="evenodd"
                            />
                          </g>
                        </svg>
                      );
                      setShowCountryDropdown(false);
                    }}
                  >
                    <span className="inline-flex items-center">
                      <svg
                        className="h-4 w-4 me-2"
                        fill="none"
                        viewBox="0 0 20 15"
                      >
                        <rect
                          width="19.6"
                          height="14"
                          y=".5"
                          fill="#fff"
                          rx="2"
                        />
                        <mask
                          id="uk"
                          style={{ maskType: "luminance" }}
                          width="20"
                          height="15"
                          x="0"
                          y="0"
                          maskUnits="userSpaceOnUse"
                        >
                          <rect
                            width="19.6"
                            height="14"
                            y=".5"
                            fill="#fff"
                            rx="2"
                          />
                        </mask>
                        <g mask="url(#uk)">
                          <path
                            fill="#0A17A7"
                            d="M0 .5h19.6v14H0z"
                          />
                          <path
                            fill="#fff"
                            fillRule="evenodd"
                            d="M-.898-.842L7.467 4.8V-.433h4.667V4.8l8.364-5.642L21.542.706l-6.614 4.46H19.6v4.667h-4.672l6.614 4.46-1.044 1.549-8.365-5.642v5.233H7.467V10.2l-8.365 5.642-1.043-1.548 6.613-4.46H0V5.166h4.672L-1.941.706-.898-.842z"
                            clipRule="evenodd"
                          />
                        </g>
                      </svg>
                      United Kingdom (+44)
                    </span>
                  </button>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="relative w-full"
          variants={itemVariants}
        >
          <motion.input
            type="tel"
            value={formatPhoneNumber(phone)}
            onChange={(e) => {
              // Only allow numbers, limit to 10 digits
              const value = e.target.value
                .replace(/\D/g, "")
                .substring(0, 10);
              setPhone(value);
              setPhoneError("");
              setPhoneLoading(false);
            }}
            placeholder="(123) 456-7890"
            className="block p-2.5 w-full z-10 text-sm text-white bg-gray-800 
                border border-gray-600 outline-none rounded-s-none"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
          />
        </motion.div>
      </motion.div>

      <motion.div 
        className="flex gap-2"
        variants={itemVariants}
      >
        <motion.button
          onClick={onBack}
          className="bg-gray-700 w-1/4 px-[10px] py-[13px] 
            rounded-[8px] transition-all duration-300 ease-in-out"
          variants={buttonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        <motion.button
          onClick={() => {
            // Format phone with country code
            const formattedPhone = `${countryCode}${phone}`;
            onSubmit(formattedPhone);
          }}
          className="bg-[rgba(86,105,255,1)] dark:bg-[rgba(63,56,221,1)] 
            shadow-[0_10px_35px_rgba(111,126,201,0.25)] w-3/4 px-[43px] py-[13px] 
            rounded-[8px] transition-all duration-300 ease-in-out"
          variants={buttonVariants}
          whileHover={{ scale: 1.03, boxShadow: "0 15px 40px rgba(111,126,201,0.35)" }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Submit Free Request"
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default PhoneInput; 