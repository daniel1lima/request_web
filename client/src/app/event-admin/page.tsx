"use client";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import DJProfile from "@/components/event/DJprofile";
import SongCard from "@/components/event/SongCard";
import { FaCheck, FaPencilRuler, FaTimes, FaTrash } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  acceptRequest,
  capturePaymentIntent,
  fetchDjById,
  fetchEventById,
  fetchPaymentById,
  fetchRequestsByEventId,
  markRequestAsPlayed,
  updateEvent,
  declineRequest as declineRequestAPI,
  deleteEvent,
  uploadFileApi,
  sendDeclinedRequestEmail,
} from "@/api/apiService";
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
import useDjStore from "@/store/djStore";

export interface Request {
  requestId: string; // Changed from number to string
  songName: string;
  songArtist: string;
  songImage: string;
  accepted: boolean; // Added
  played: boolean;
  requestUpvotes: number;
  userId: string | null; // Added
  eventId: string; // Added
  paymentId: string; // Added
  status: string;
  createdAt: string; // Added
  updatedAt: string; // Added
  User: null | any; // Added
  Event: {
    // Added
    eventName: string;
  };
  Payment: {
    // Added
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

const EventAdminPage = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { getToken } = useAuth();

  // Get data and actions from stores
  const {
    requests: songRequests,
    fetchRequests,
    isLoading: requestsLoading,
  } = useRequestStore();
  const { currentEvent, fetchEvent } = useEventStore();
  const {
    djData,
    settings,
    sliderValue,
    selectedFile,
    imagePreview,
    loadingStates,
    isAuthorized,
    loading,

    setDjData,
    setSettings,
    setSliderValue,
    setSelectedFile,
    setImagePreview,
    setLoadingState,
    setIsAuthorized,
    setLoading,

    fetchDj,
    acceptRequestFunc,
    playedRequest,
    declineRequest,
    handleDeleteEvent,
    updateEventSettings,
    uploadFile,
  } = useAdminStore();


  // Get data from djStore
  const { fetchDj: fetchDjFromStore, currentDj } = useDjStore();

  // Local state
  const [isMobile, setIsMobile] = useState(false);
  const [noRequests, setNoRequests] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      eventName: settings.eventName || "",
    },
  });

  // Fetch event data
  const refreshEventData = useCallback(async () => {
    const eventId = localStorage.getItem("eventId");
    if (!eventId || !user) return;

    try {
      // Fetch requests using the store action
      await fetchRequests(eventId);
      
      // Get the latest requests from the store
      const { requests } = useRequestStore.getState();
      
      // Update the local state based on the store data
      setNoRequests(requests.length === 0);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not update event data",
        variant: "destructive",
      });
    }
  }, [user, toast, fetchRequests]);

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
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      const success = await acceptRequestFunc(requestId, accesstoken);
      if (success) {
        // Update local state to reflect changes immediately
        const updatedRequests = songRequests.map((req) =>
          req.requestId === requestId
            ? { ...req, accepted: true, status: "accepted" }
            : req
        );
        // This is a workaround since we can't directly modify the store's state
        // In a real implementation, the store should handle this update
        refreshEventData();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handlePlayedRequest = async (requestId: string) => {
    try {
      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      const success = await playedRequest(requestId, accesstoken, songRequests);
      if (success) {
        // Update local state to reflect changes immediately
        refreshEventData();
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to mark request as played",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    // Immediately update UI
    const requestToDecline = songRequests.find(
      (req) => req.requestId === requestId
    );
    if (!requestToDecline?.paymentId) return;

    try {
      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      const success = await declineRequest(
        requestId,
        accesstoken,
        requestToDecline.paymentId
      );
      if (success) {
        refreshEventData();

        toast({
          title: "Request declined",
          description:
            "The user has been notified that their request was declined.",
        });
      }
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Error",
        description: "There was a problem declining this request.",
        variant: "destructive",
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
        redirect("/");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
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
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: `There was an error updating the event. ${error}`,
        variant: "destructive",
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
        await fetchEvent(eventId);
        
        toast({
          title: "Settings updated!",
          description: "Your settings have been successfully updated.",
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
    setLoading(true);

    const fetchInitialData = async () => {
      try {
        // First check if the event is already in the store
        const { currentEvent } = useEventStore.getState();
        
        // Only fetch the event if it's not in the store or if it's a different event
        if (!currentEvent || currentEvent.eventId !== eventId) {
          await fetchEvent(eventId);
          // Get the updated event from the store
          const { currentEvent: updatedEvent } = useEventStore.getState();
          if (!updatedEvent) {
            window.location.href = "/404";
            return;
          }
        }
        
        // At this point, we should have the event in the store
        const { currentEvent: storeEvent } = useEventStore.getState();
        if (!storeEvent) {
          window.location.href = "/404";
          return;
        }
        
        console.log("Event Data:", storeEvent);
        
        // Set the event title and image from the store data
        // setEventTitle(storeEvent.eventName);
        // setEventImage(storeEvent.eventImage);

        setSettings({
          eventName: storeEvent.eventName,
          eventImage: storeEvent.eventImage,
          requestFee: storeEvent.requestFee,
          acceptRequests: storeEvent.acceptRequests,
          freeRequests: storeEvent.acceptFreeRequests,
          freeEmailRequests: storeEvent.acceptEmailRequests
        });
        
        // Set the slider value based on the request fee
        setSliderValue([storeEvent.requestFee]);
        
        // Fetch requests for this event
        await fetchRequests(eventId);

        // If the event has a DJ ID, fetch the DJ data
        if (storeEvent.djId) {
          // Check if we already have the DJ data in the store
          const { currentDj } = useDjStore.getState();
          
          // Only fetch DJ data if it's not in the store or if it's a different DJ
          if (!currentDj || currentDj.djId !== storeEvent.djId) {
            await fetchDjFromStore(storeEvent.djId);
          }
          
          // Get the current DJ from the store
          const { currentDj: storeDj } = useDjStore.getState();
          
          console.log("User ID:", user?.id);
          console.log("DJ ID:", storeDj?.djId);

          // Check if the user is the DJ for this event
          if (storeDj && user?.id === storeDj.djId) {
            setIsAuthorized(true);
            setNoRequests(songRequests.length === 0);
          } else {
            window.location.href = `/event?eventId=${eventId}`;
          }
          setLoading(false);
        } else {
          // Fallback to localStorage if needed
          const storedDjId = localStorage.getItem("djId");
          if (storedDjId) {
            // Check if we already have the DJ data in the store
            const { currentDj } = useDjStore.getState();
            
            // Only fetch DJ data if it's not in the store or if it's a different DJ
            if (!currentDj || currentDj.djId !== storedDjId) {
              await fetchDjFromStore(storedDjId);
            }
            
            // Get the current DJ from the store
            const { currentDj: storeDj } = useDjStore.getState();
            
            console.log("User ID:", user?.id);
            console.log("DJ ID:", storeDj?.djId);

            if (storeDj && user?.id === storeDj.djId) {
              setIsAuthorized(true);
              setNoRequests(songRequests.length === 0);
            } else {
              window.location.href = `/event?eventId=${eventId}`;
            }
            setLoading(false);
          } else {
            // If we get here, there's no DJ ID to check against
            console.log("No DJ ID found to check against");
            setLoading(false);
            window.location.href = `/event?eventId=${eventId}`;
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        window.location.href = "/404";
      }
    };

    fetchInitialData();
  }, [
    user,
    fetchEvent,
    fetchRequests,
    fetchDjFromStore,
    setLoading,
    setIsAuthorized,
    songRequests.length,
  ]);

  useEffect(() => {
    if (!isAuthorized || loading) return;

    const intervalId = setInterval(() => {
      refreshEventData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthorized, loading, refreshEventData]);

  if (loading || !isAuthorized) return <Loader />;

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
                      <Input placeholder={settings.eventName || ""} {...field} />
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

  return (
    <div
      className={`bg-gray-900 dark:bg-gray-900 ${
        songRequests.filter((req) => req.accepted && !req.played).length ===
          0 &&
        songRequests.filter((req) => !req.accepted && !req.played).length === 0
          ? "h-screen"
          : "h-full"
      }`}
    >
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
              <div className="flex flex-row gap-5 ">
                <h1 className="text-6xl font-bold text-white mb-2">
                  {settings.eventName}
                </h1>
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
            <div className="absolute right-20 bg-opacity-90 rounded-lg flex items-center justify-center pr-8 bg-black/40 backdrop-blur-sm  px-4 py-2 transform-origin-right">
              <DJProfile
                name={djData?.djName || "DJ Zo"}
                role="Main Event DJ"
                image={djData?.djImageUrl || ""}
                insta={
                  djData?.djInsta
                    ? isMobile
                      ? `https://www.instagram.com/${djData.djInsta}`
                      : `https://www.instagram.com/${djData.djInsta}`
                    : ""
                }
              />
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
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Songs Requested Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Songs Requested
                </h3>
              </div>
              <p className="text-4xl font-semibold text-white">
                {songRequests.length}
              </p>
            </div>

            {/* Songs Played Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Songs Played</h3>
              </div>
              <p className="text-4xl font-semibold text-white">
                {songRequests.filter((req) => req.played).length}
              </p>
            </div>

            {/* DJ Earnings Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">DJ Earnings</h3>
              </div>
              <p className="text-4xl font-semibold text-white">
                $
                {(
                  songRequests
                    .filter((req) => req.played)
                    .reduce(
                      (total, req) => total + (req.Payment?.amount || 0),
                      0
                    ) / 100
                ).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-full">
            {/* Accepted Songs Column */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
                Accepted Requests
              </h2>
              <div className="space-y-4">
                {songRequests
                  .filter(
                    (req) =>
                      req.accepted && !req.played && req.status == "accepted"
                  )
                  .map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-gray-700 rounded-lg p-4 transition-all hover:shadow-lg relative group"
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
                          disabled={loadingStates[request.requestId]}
                        >
                          {loadingStates[request.requestId] ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <FaCheck className="w-6 h-6 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Requested Songs Column */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl  overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
                New Requests
              </h2>
              <div className="space-y-4">
                {songRequests
                  .filter((req) => req.status == "pending")
                  .map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-gray-700 rounded-lg p-4 transition-all hover:shadow-lg relative group "
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
                            onClick={() =>
                              handleAcceptRequest(request.requestId)
                            }
                            className="bg-gray-600 group-hover:bg-green-500 hover:!bg-green-600 p-3 rounded-full transition-colors"
                          >
                            <FaCheck className="w-6 h-6 text-white" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeclineRequest(request.requestId)
                            }
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
              </div>
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
