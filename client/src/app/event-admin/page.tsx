"use client";
import type React from "react";
import { useEffect, useState } from "react";
import DJProfile from "@/components/event/DJprofile";

import { FaCheck, FaPencilRuler, FaTimes, FaTrash } from "react-icons/fa";
import { ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth, useUser } from "@clerk/nextjs";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { notFound, redirect } from "next/navigation";
import useEventStore from "@/store/eventStore";
import useRequestStore from "@/store/requestStore";
import useAdminStore from "@/store/adminStore";
import { useRouter } from "next/navigation";
import WebSocketService from "@/services/websocketService";
import AcceptedSongsColumn from "@/components/event/AcceptedSongsColumn";
import NewRequestsColumn from "@/components/event/NewRequestsColumn";
import EventStats from "@/components/event/EventStats";
import {
  createDJ,
  addDJToEvent,
  getEventDJs,
  setEventActiveDJ,
  removeDJFromEvent,
} from "@/api/apiService";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

export interface Request {
  requestId: string;
  songName: string;
  songArtist: string;
  songImage: string;
  accepted: boolean;
  played: boolean;
  requestUpvotes: number;
  userId: string | null;
  eventId: string;
  paymentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  User: null | any;
  Event: {
    eventName: string;
  };
  Payment: {
    amount: number;
  };
}

export interface DJ {
  djId: string;
  djName: string;
  djEmail: string;
  djPhone: string;
  djInsta: string;
  djImageUrl: string;
  createdAt: string;
  updatedAt: string;
  Events: Array<{
    eventId: string;
    eventName: string;
    eventImage: string;
    eventDateTime: string;
    eventLocation: string;
    requestFee: number;
    djId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  Payments: Array<{
    paymentId: string;
    amount: number;
    paymentDate: string;
    status: string;
    djId: string;
  }>;
}

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
    <Loader2 className="w-6 h-6 text-white animate-spin" />
  </div>
);

const validateResponseNoReturn = (response: any) => {
  if ("ok" in response && !response.ok) {
    throw new Error("Network response was not ok");
  }
  if ("success" in response && !response.success) {
    throw new Error("Request failed");
  }
  return;
};

// Define the schema for the form
const FormSchema = z.object({
  eventName: z.string().min(1, {
    message: "Event name is required.",
  }),
});

// Add this schema definition near your other schemas
const DJFormSchema = z.object({
  djName: z.string().min(1, { message: "DJ name is required" }),
  djInsta: z.string().optional(),
});

const EventAdminPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { getToken } = useAuth();
  const router = useRouter();

  // Get data and actions from stores
  const {
    requests: songRequests,
    fetchRequests,
    isLoading: requestsLoading,
    setRequests,
    connectToEventSocket,
    disconnectFromEventSocket,
    wsConnected,
  } = useRequestStore();
  const { currentEvent, fetchEvent } = useEventStore();
  const {
    settings,
    sliderValue,
    selectedFile,
    imagePreview,
    loadingStates,
    isAuthorized,
    loading,

    setSettings,
    setSliderValue,
    setSelectedFile,
    setImagePreview,
    setLoadingState,
    setIsAuthorized,
    setLoading,

    acceptRequestFunc,
    playedRequest,
    declineRequest,
    handleDeleteEvent,
    updateEventSettings,
    uploadFile,
  } = useAdminStore();

  // Local state
  const [isMobile, setIsMobile] = useState(false);
  const [noRequests, setNoRequests] = useState(false);

  // Add a connection indicator state
  const [socketConnected, setSocketConnected] = useState(false);

  // Add state for available DJs
  const [availableDJs, setAvailableDJs] = useState<DJ[]>([]);
  // const [isChangingDJ, setIsChangingDJ] = useState(false);

  const [mounting, setMounting] = useState(true);

  // Add these state variables near the top with your other state declarations
  const [isCreatingDJ, setIsCreatingDJ] = useState(false);
  // const [newDjName, setNewDjName] = useState("");
  // const [newDjInsta, setNewDjInsta] = useState("");

  // Add a state to track all DJs associated with this event
  const [eventDJs, setEventDJs] = useState<DJ[]>([]);

  // Add a new state to track the currently active DJ ID
  const [activeDjId, setActiveDjId] = useState<string | null>(null);

  // Add state for DJ image file
  const [djImageFile, setDjImageFile] = useState<File | null>(null);
  const [djImagePreview, setDjImagePreview] = useState<string | null>(null);

  // Add a local state for active DJ
  const [activeDj, setActiveDj] = useState<DJ | null>(null);

  // Form setup
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      eventName: settings.eventName || "",
    },
  });

  // Inside your component, add this form setup
  const djForm = useForm<z.infer<typeof DJFormSchema>>({
    resolver: zodResolver(DJFormSchema),
    defaultValues: {
      djName: "",
      djInsta: "",
    },
  });

  // Settings handlers
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    setSettings({ requestFee: value[0] });
  };

  const handleAcceptRequestsChange = (value: boolean) => {
    setSettings({ acceptRequests: value });
  };

  const handleFreeRequestsChange = (value: boolean) => {
    setSettings({
      freeRequests: value,
      freeEmailRequests: value ? false : settings.freeEmailRequests,
    });
  };

  const handleFreeEmailRequestsChange = (value: boolean) => {
    setSettings({
      freeEmailRequests: value,
      freeRequests: value ? false : settings.freeRequests,
    });
  };

  // File handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadFileHandler = async () => {
    try {
      if (!selectedFile) {
        toast({
          variant: "destructive",
          title: "Missing Event Image!",
          description: "No file selected for Event Image",
        });
        return null;
      }

      const url = await uploadFile(selectedFile);
      if (url) {
        setSettings({ eventImage: url });
        return url;
      }
      return null;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Image Upload Failed",
        description: `${e}`,
      });
      return null;
    }
  };

  // Request management functions

  const handlePlayedRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific request
      setLoadingState(requestId, true);

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      // Find the request to update
      const requestToPlay = songRequests.find(
        (req) => req.requestId === requestId
      );
      if (!requestToPlay) return;

      // Optimistic UI update - immediately update the request status
      const optimisticRequests = songRequests.map((req) =>
        req.requestId === requestId
          ? { ...req, played: true, status: "played" }
          : req
      );

      // Update the request store with our optimistic data
      setRequests(optimisticRequests);

      // Now make the actual API call
      const success = await playedRequest(requestId, accesstoken, songRequests);

      // Clear loading state regardless of outcome
      setLoadingState(requestId, false);

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
      setLoadingState(requestId, false);

      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to mark request as played",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  useEffect(() => {
    console.log("loading", loading);
  }, [loading]);

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

      console.log("Success:", success);

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
      req.requestId === requestId ? { ...req, status: "declined" } : req
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

  // Event management functions
  const deleteEventHandler = async () => {
    try {
      const eventId = localStorage.getItem("eventId");
      if (!eventId) return;

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      const success = await handleDeleteEvent(eventId, accesstoken);
      if (success) {
        // Use router.push instead of window.location.href
        router.push("/");
        return; // Add return to prevent further execution
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const eventId = localStorage.getItem("eventId");
      if (!eventId) return;

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      // Update settings with the new event name first
      setSettings({ eventName: data.eventName });

      const updatedEventData = {
        eventId,
        eventName: data.eventName,
        eventImage: settings.eventImage,
        eventLocation: "",
        requestFee: settings.requestFee,
        djId: user?.id || "",
      };

      const success = await updateEventSettings(
        eventId,
        updatedEventData,
        accesstoken
      );
      if (success) {
        // Refresh event data to ensure all components have the latest data
        await fetchEvent(eventId);

        toast({
          title: "Event updated!",
          description: `New event name: ${data.eventName}`,
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: `There was an error updating the event. ${error}`,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleSettingsSubmit = async () => {
    try {
      const eventId = localStorage.getItem("eventId");
      if (!eventId) return notFound();

      let imageUrl;
      if (selectedFile) {
        imageUrl = await uploadFileHandler();
        if (imageUrl) {
          // Update settings with the new image URL
          setSettings({ eventImage: imageUrl });
        }
      }

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      const updatedEventData = {
        eventImage: imageUrl || settings.eventImage,
        requestFee: settings.requestFee,
        acceptRequests: settings.acceptRequests,
        acceptFreeRequests: settings.freeRequests,
        acceptEmailRequests: settings.freeEmailRequests,
      };

      const success = await updateEventSettings(
        eventId,
        updatedEventData,
        accesstoken
      );

      if (success) {
        // Refresh event data to ensure all components have the latest data
        // await fetchEvent(eventId);

        toast({
          title: "Settings updated!",
          description: "Your settings have been successfully updated.",
          duration: 2000,
        });

        if (selectedFile) {
          setSelectedFile(null);
          setImagePreview(null);
        }
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your settings.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Effects
  // useEffect(() => {
  //   if (settings.eventImage) {
  //     setEventImage(settings.eventImage);
  //   }
  // }, [settings.eventImage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const eventId = new URL(window.location.href).searchParams.get("eventId");
    if (!eventId || !user) return;

    localStorage.setItem("eventId", eventId);
    setMounting(true);

    const fetchInitialData = async () => {
      try {
        // Fetch event data
        await fetchEvent(eventId);
        const { currentEvent: storeEvent } = useEventStore.getState();
        if (!storeEvent) {
          window.location.href = "/404";
          return;
        }

        // Set up settings
        setSettings({
          eventName: storeEvent.eventName,
          eventImage: storeEvent.eventImage,
          requestFee: storeEvent.requestFee,
          acceptRequests: storeEvent.acceptRequests,
          freeRequests: storeEvent.acceptFreeRequests,
          freeEmailRequests: storeEvent.acceptEmailRequests,
        });
        setSliderValue([storeEvent.requestFee]);

        // Fetch requests for this event
        await fetchRequests(eventId, true);

        // Fetch all DJs for this event - this will include the main DJ
        await fetchEventDJs();

        // Check if the user is authorized to view this page (they should be the DJ)
        if (user?.id === storeEvent.djId) {
          setIsAuthorized(true);
          // Initial check for no requests
          const { requests } = useRequestStore.getState();
          setNoRequests(requests.length === 0);
        } else {
          // If not authorized, redirect to the event page
          window.location.href = `/event?eventId=${eventId}`;
        }
        
        setMounting(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMounting(false);
        window.location.href = "/404";
      }
    };

    fetchInitialData();
  }, [user, fetchEvent, fetchRequests, setMounting, setIsAuthorized]);

  // Add effect to connect to WebSocket
  useEffect(() => {
    if (!isAuthorized) return;

    const eventId = localStorage.getItem("eventId");
    if (!eventId) return;

    // Connect to WebSocket for real-time updates
    connectToEventSocket(eventId);
    setSocketConnected(true);

    // Check connection status periodically
    const intervalId = setInterval(() => {
      const wsService = WebSocketService.getInstance();
      setSocketConnected(wsService.isConnected());
    }, 5000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      disconnectFromEventSocket();
    };
  }, [isAuthorized, connectToEventSocket, disconnectFromEventSocket]);

  // Function to fetch DJs for this event
  const fetchEventDJs = async () => {
    try {
      const eventId = localStorage.getItem("eventId");
      if (!eventId) return;

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      setLoadingState("fetchingDJs", true);

      // Use the existing API function from apiService
      const data = await getEventDJs(eventId, accesstoken);
      setEventDJs(data);
      
      // If we have a currentEvent with currentDjId, find and set the active DJ
      const { currentEvent } = useEventStore.getState();
      if (currentEvent) {
        const djIdToUse = currentEvent.currentDjId || currentEvent.djId;
        if (djIdToUse) {
          const foundDj = data.find(dj => dj.djId === djIdToUse);
          if (foundDj) {
            setActiveDj(foundDj);
            setActiveDjId(foundDj.djId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event DJs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch DJs for this event",
        variant: "destructive",
      });
    } finally {
      setLoadingState("fetchingDJs", false);
    }
  };

  // Add a handler for DJ image file selection
  const handleDjImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setDjImageFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setDjImagePreview(previewUrl);
    }
  };

  // Update the handleCreateDJ function to include image upload
  const handleCreateDJ = async (values: z.infer<typeof DJFormSchema>) => {
    try {
      setLoadingState("creatingDJ", true);

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      const eventId = localStorage.getItem("eventId");
      if (!eventId) return;

      // Generate a unique ID for the new DJ
      const newDjId = `dj_${Date.now()}`;

      // Upload the DJ image if one was selected
      let djImageUrl = "";
      if (djImageFile) {
        try {
          const uploadResult = await uploadFile(djImageFile);
          djImageUrl = uploadResult || ""; // Ensure we always have a string
        } catch (error) {
          console.error("Error uploading DJ image:", error);
          toast({
            title: "Image Upload Failed",
            description:
              "Failed to upload DJ image, but will continue creating DJ",
            variant: "destructive",
          });
        }
      }

      // Use the existing API function from apiService
      await createDJ(
        {
          djId: newDjId,
          djName: values.djName,
          djEmail:
            user?.primaryEmailAddress?.emailAddress || "",
          djInsta: values.djInsta || "",
          djImageUrl, // Add the image URL directly without the property name
        },
        accesstoken
      );

      // Add the DJ to the event using the existing API function
      await addDJToEvent(eventId, newDjId, accesstoken);

      // Reset form and state
      djForm.reset();
      setDjImageFile(null);
      setDjImagePreview(null);
      setIsCreatingDJ(false);

      // Refresh the DJ list
      await fetchEventDJs();

      toast({
        title: "DJ Created",
        description: `${values.djName} has been added to the event`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error creating DJ:", error);
      toast({
        title: "Error",
        description: "Failed to create DJ",
        variant: "destructive",
      });
    } finally {
      setLoadingState("creatingDJ", false);
    }
  };

  // Add this to your useEffect that initializes loading states or wherever appropriate
  useEffect(() => {
    // Make sure creatingDJ is included in loadingStates
    if (!("creatingDJ" in loadingStates)) {
      setLoadingState("creatingDJ", false);
    }
  }, [loadingStates, setLoadingState]);

  // Add effect to set the initial active DJ when the component mounts
  

  // Add effect to fetch event DJs when the component mounts
  useEffect(() => {
    if (isAuthorized) {
      fetchEventDJs();
    }
  }, [isAuthorized]);

  // Update the setActiveDj function to use the store
  const handleSetActiveDj = async (djId: string) => {
    try {
      const eventId = localStorage.getItem("eventId");
      if (!eventId) return;

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      setLoadingState("changingDJ", true);
      
      // Call the API to set the active DJ
      await setEventActiveDJ(eventId, djId, accesstoken);
      
      // Find the DJ in the eventDJs array
      const selectedDj = eventDJs.find(dj => dj.djId === djId);
      
      // Update the local state with the selected DJ
      if (selectedDj) {
        setActiveDj(selectedDj);
        setActiveDjId(djId);
      }
      
      toast({
        title: "DJ Updated",
        description: "The active DJ has been updated",
        duration: 2000,
      });
      
      // Refresh event data to get the updated event info
      await fetchEvent(eventId);
    } catch (error) {
      console.error("Error setting active DJ:", error);
      toast({
        title: "Error",
        description: "Failed to update the active DJ",
        variant: "destructive",
      });
    } finally {
      setLoadingState("changingDJ", false);
    }
  };

  // Update the handleDeleteDj function
  const handleDeleteDj = async (djId: string) => {
    try {
      if (djId === activeDjId) {
        toast({
          title: "Cannot Delete Active DJ",
          description: "Please select another DJ as active before deleting this one.",
          variant: "destructive",
        });
        return;
      }

      if (djId === currentEvent?.djId) {
        toast({
          title: "Cannot Delete Main DJ",
          description: "The main DJ for this event cannot be removed.",
          variant: "destructive",
        });
        return;
      }

      const eventId = localStorage.getItem("eventId");
      if (!eventId) return;

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      setLoadingState("deletingDJ", true);

      // First, remove the DJ from the event using the existing endpoint
      await removeDJFromEvent(eventId, djId, accesstoken);

      // Update local state
      setEventDJs(prev => prev.filter(dj => dj.djId !== djId));

      // Refresh event data
      await fetchEventDJs();
    } catch (error) {
      console.error("Error removing DJ:", error);
      toast({
        title: "Error",
        description: "Failed to remove the DJ",
        variant: "destructive",
      });
    } finally {
      setLoadingState("deletingDJ", false);
    }
  };

  if (mounting) return <Loader />;

  const FeeBadge = (
    <div className="relative group">
      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-[1px] rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 mt-3">
        <div className="px-6 py-2 rounded-full bg-gray-900/90 backdrop-blur-xl">
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-200 text-lg md:text-xl lg:text-2xl font-medium">
            ${(sliderValue[0] / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );

  const FeeSetting = (
    <div className="  rounded-lg p-3">
      <div className="flex flex-col mb-4">
        <label className="text-lg font-medium text-center mb-4">Fee</label>
      </div>

      <div className="flex flex-col mb-4 gap-5 items-center">
        <Slider
          value={sliderValue}
          min={99}
          max={2499}
          step={50}
          onValueChange={handleSliderChange}
          className="cursor-pointer"
        />
        {FeeBadge}
      </div>
    </div>
  );

  const EventImageSetting = (
    <div className="rounded-lg p-3">
      <div className="flex flex-col mb-4 gap-5">
        <label className="text-lg font-medium text-center">Event Image</label>
        <div className=" rounded-lg p-3">
          <div className="flex items-center justify-center w-full">
            {!selectedFile && (
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300  rounded-lg cursor-pointer bg-gray-50  dark:bg-gray-700 hover:bg-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                onDragOver={handleDragOver} // Add drag over event
                onDrop={handleDrop} // Add drop event
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                  </p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif, image/svg+xml" // Limit to image files
                  onChange={handleFileChange} // Handle file change
                />
              </label>
            )}
          </div>
          {/* Display the name of the selected file */}
          {selectedFile && imagePreview && (
            <div className="mb-4 items-center justify-center flex flex-col gap-5">
              <Image
                src={imagePreview || "/placeholder.svg"}
                alt="Image Preview"
                width={100} // Set desired width
                height={100} // Set desired height
                className="rounded-lg" // Optional styling
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{selectedFile.name}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const RequestLimitingSetting = (
    <div className="flex flex-row w-full items-center justify-center gap-20">
      <div className="flex flex-col mb-5 gap-5 text-center items-center justify-center">
        <Label>Accept Requests</Label>
        <Switch
          checked={settings.acceptRequests}
          onCheckedChange={handleAcceptRequestsChange}
        />
      </div>
      <div className="flex flex-col mb-5 gap-5 text-center items-center justify-center">
        <Label>First Request Free</Label>
        <Switch
          checked={settings.freeEmailRequests}
          onCheckedChange={handleFreeEmailRequestsChange}
        />
      </div>
      <div className="flex flex-col mb-5 gap-5 text-center items-center justify-center">
        <Label>Free Requests</Label>
        <Switch
          checked={settings.freeRequests}
          onCheckedChange={handleFreeRequestsChange}
        />
      </div>
    </div>
  );

  const DeleteEvent = (
    <div className="flex text-center items-center justify-center">
      <Dialog>
        <DialogTrigger className="flex items-center justify-center mt-5 rounded-md p-2 mb-5 shadow-md bg-slate-600 hover:outline">
          <FaTrash className=" text-red-500" />
        </DialogTrigger>
        <DialogContent className="w-[500px]">
          <DialogTitle className="text-center">
            Are you sure you want to delete this event?
          </DialogTitle>
          <div className="text-center flex flex-col gap-10 items-center mt-10">
            <Label className="text-pretty leading-8">
              We highly suggest closing the event - You will lose any analytics
              or payments regarding this event if it is deleted.
            </Label>
            <Button
              type="submit"
              variant={"outline"}
              className="max-w-[200px] bg-green-500 hover:bg-green-800 outline-none text-white"
            >
              Close Event
            </Button>
            <Button
              type="submit"
              variant={"outline"}
              className="max-w-[100px] bg-red-600 hover:bg-red-900 outline-none text-white"
              onClick={() => {
                deleteEventHandler();
              }}
            >
              Delete Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const ChangeEventName = (
    <div className="flex text-center items-center ">
      <Popover>
        <PopoverTrigger className="flex items-center justify-center rounded-md p-2 shadow-md bg-slate-600 hover:outline">
          <FaPencilRuler className="text-white" />
        </PopoverTrigger>
        <PopoverContent className="w-[300px]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 p-5"
            >
              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={settings.eventName || ""}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Save</Button>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );

  // You can add a connection indicator in your UI
  const ConnectionStatus = () => (
    <div
      className={`px-2 py-1 rounded-full flex items-center ${socketConnected ? "bg-green-500/20" : "bg-red-500/20"}`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2 ${socketConnected ? "bg-green-500" : "bg-red-500"}`}
      ></div>
      <span className="text-xs font-medium">
        {socketConnected ? "Live" : "Offline"}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-900 dark:bg-gray-900 h-full">
      {/* Updated Header Section with increased height */}
      <div
        className="relative bg-cover bg-center h-48"
        style={{
          backgroundImage: `url(${settings.eventImage || currentEvent?.eventImage})`,
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-8 h-full">
          {/* Content container with flex layout */}
          <div className="flex items-center h-full space-x-8">
            {/* Logo - increased height */}
            <Image
              src="/RequestLogoDark.png"
              alt="Logo"
              width={225}
              height={225}
              priority
            />

            {/* Title content */}
            <div>
              <div className="flex flex-row gap-5 items-center">
                <h1 className="text-6xl font-bold text-white mb-2">
                  {settings.eventName}
                </h1>
                {/* Add connection status indicator */}
                <ConnectionStatus />
              </div>
              <div className="flex-row flex gap-4 items-center">
                {SettingsDialog(
                  FeeSetting,
                  EventImageSetting,
                  RequestLimitingSetting,
                  handleSettingsSubmit
                )}
                {ChangeEventName}
                {DeleteEvent}
              </div>
            </div>

            {/* DJ Profile moved to header with transparent grey card, aligned to the absolute right */}
            <div className="absolute right-20 bg-opacity-90 rounded-lg flex items-center justify-center  bg-black/40 backdrop-blur-sm px-4 py-2 transform-origin-right">
              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-3">
                      <DJProfile
                        name={activeDj?.djName || "DJ Zo"}
                        role="Currently Playing"
                        image={
                          activeDj?.djImageUrl || "/RequestLogoDark.png"
                        }
                        insta={
                          activeDj?.djInsta
                            ? isMobile
                              ? `https://www.instagram.com/${activeDj.djInsta}`
                              : `https://www.instagram.com/${activeDj.djInsta}`
                            : ""
                        }
                      />
                      <ChevronDown className="text-white h-5 w-5" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[300px] max-w-[300px] max-h-[400px] overflow-y-auto bg-black/50 border-black/40"
                    align="center"
                    sideOffset={10}
                  >
                    <div className="p-4">
                      {isCreatingDJ ? (
                        <AnimatePresence mode="wait">
                          <motion.div
                            className="mb-4 p-3 bg-gray-800/50 rounded-md"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.1 }}
                          >
                            <h4 className="text-white text-sm mb-2">
                              Add New DJ
                            </h4>
                            <Form {...djForm}>
                              <form
                                onSubmit={djForm.handleSubmit(handleCreateDJ)}
                                className="space-y-3"
                              >
                                <FormField
                                  control={djForm.control}
                                  name="djName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="DJ Name"
                                          className="bg-gray-700 border-gray-600"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={djForm.control}
                                  name="djInsta"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="Instagram Handle (optional)"
                                          className="bg-gray-700 border-gray-600"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* DJ Image Upload */}
                                <div className="space-y-2">
                                  <label className="text-sm text-gray-300">
                                    DJ Image (optional)
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                      onClick={() =>
                                        document
                                          .getElementById("dj-image-upload")
                                          ?.click()
                                      }
                                    >
                                      Select Image
                                    </Button>
                                    <input
                                      id="dj-image-upload"
                                      type="file"
                                      className="hidden"
                                      accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                      onChange={handleDjImageChange}
                                    />
                                  </div>

                                  {/* Image Preview */}
                                  {djImagePreview && (
                                    <div className="mt-2">
                                      <img
                                        loading="lazy"
                                        srcSet={djImagePreview}
                                        className="aspect-[1.02] object-cover w-[45px] h-[45px] shrink-0 rounded-full overflow-hidden"
                                        alt={djImagePreview}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    type="submit"
                                    disabled={loadingStates.creatingDJ}
                                    className="bg-[rgba(86,105,255,1)] hover:bg-[rgba(86,105,255,0.8)] text-white flex-1"
                                  >
                                    {loadingStates.creatingDJ ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Create"
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      setIsCreatingDJ(false);
                                      setDjImageFile(null);
                                      setDjImagePreview(null);
                                      djForm.reset();
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </motion.div>
                        </AnimatePresence>
                      ) : loadingStates.fetchingDJs ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {eventDJs.length > 0 ? (
                            // Filter out the currently active DJ from the list
                            eventDJs
                              .filter((dj) => dj.djId !== activeDjId)
                              .map((dj) => (
                                <div
                                  key={dj.djId}
                                  className="flex items-center gap-3 p-2 mb-2 rounded-md cursor-pointer transition-colors hover:bg-gray-800/50"
                                >
                                  {/* Simple DJ display component */}
                                  <div 
                                    className="flex items-center gap-3 w-full"
                                    onClick={() => handleSetActiveDj(dj.djId)}
                                  >
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                                      <img
                                        loading="lazy"
                                        srcSet={dj.djImageUrl || "/RequestLogoDark.png"}
                                        className="aspect-[1.02] object-cover w-[45px] h-[45px] shrink-0 rounded-full overflow-hidden"
                                        alt={dj.djName}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-white font-medium">
                                        {dj.djName}
                                      </p>
                                      {dj.djId === currentEvent?.djId && (
                                        <p className="text-slate-500 font-light text-xs">
                                          Main DJ
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Delete DJ button */}
                                  <div
                                    onClick={(e) => {
                                      handleDeleteDj(dj.djId);
                                    }}
                                    className="h-6 w-8 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/50 transition-colors cursor-pointer"
                                  >
                                    <FaTimes className="text-red-500 text-xs" />
                                  </div>
                                </div>
                              ))

                              
                          ) : (
                            <p className="text-center text-gray-400 py-2">
                              No DJs added to this event yet
                            </p>
                          )}

                          {/* Show a message if all DJs are filtered out */}
                          {eventDJs.length > 0 &&
                            eventDJs.filter((dj) => dj.djId !== activeDjId)
                              .length === 0 && (
                              <p className="text-center text-gray-400 py-2">
                                No other DJs available
                              </p>
                            )}
                            
                          {/* Add Create DJ button - using div instead of Button */}
                          {!isCreatingDJ && (
                            <div className="flex justify-center mt-3 pt-2 border-t border-gray-700">
                              <div
                                onClick={() => setIsCreatingDJ(true)}
                                className="bg-[#1a1c31] hover:bg-[rgba(86,105,255,0.8)] h-8 w-8 p-0 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <FaTimes className="text-white transform rotate-45" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      {noRequests ? (
        <div className="flex items-center justify-center h-[80vh] mb-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold">No requests yet</h2>
            <p className="text-2xl text-gray-500">
              Check back later for song requests
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          {/* Use the EventStats component */}
          <EventStats />

          <div className="flex flex-col md:flex-row gap-8 max-h-full">
            {/* Accepted songs column - can have different width than new requests */}
            <div className="w-[50%]">
              <AcceptedSongsColumn />
            </div>
            {/* New requests column - can have different width than accepted songs */}
            <div className="w-[50%]">
              <NewRequestsColumn />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAdminPage;

function SettingsDialog(
  FeeSetting: React.JSX.Element,
  EventImageSetting: React.JSX.Element,
  RequestLimitingSetting: React.JSX.Element,
  handleSettingsSubmit: () => Promise<void>
) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className=" rounded-md p-3 shadow-lg text-white hover:outline bg-gradient-to-r from-violet-700 to-fuchsia-700  ">
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className=" w-[500px] z-50">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl">
            Event Settings
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-lg p-3 flex flex-col gap-2 text-center">
          {FeeSetting}

          {EventImageSetting}

          {RequestLimitingSetting}

          <DialogClose asChild>
            <Button
              className="bg-purple-600 text-white rounded-md p-2 mt-2 hover:bg-blue-600 transition-colors ease-in-out duration-200"
              onClick={() => {
                handleSettingsSubmit();
              }}
            >
              Save
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
