"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { notFound, redirect, useRouter } from "next/navigation";
import "./globals.css";
import EventCard from "@/components/event/EventCard";
import { FaHome, FaMusic, FaUser } from "react-icons/fa";
import Link from "next/link";
import Fuse from "fuse.js";
import { useUser, SignIn, UserButton, useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast, useToast } from "@/hooks/use-toast";
import useEventStore from "../store/eventStore";
import useUIStore from "../store/uiStore";
import {uploadFileApi } from "../api/apiService";
import Loader from "@/components/loader";

export interface Event {
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDateTime: string;
  eventLocation: string;
  requestFee: number;
  djId: string;
  createdAt: string;
  updatedAt: string;
  acceptRequests: boolean;
  acceptFreeRequests: boolean;
  acceptEmailRequests: boolean;
}

const createFuseInstance = (events: Event[]) => {
  return new Fuse(events, {
    keys: ["eventName", "eventLocation"],
    threshold: 0.4,
    location: 0,
    distance: 100,
    minMatchCharLength: 2,
  });
};

const ExploreView = ({
  allEvents,
  searchQuery,
  setCurrentView,
}: {
  allEvents: Event[] | null;
  searchQuery: string;
  setCurrentView: (view: "explore" | "events") => void;
}) => {
  const filterAndSearchEvents = (events: Event[]) => {
    if (!searchQuery) return events;
    const fuse = createFuseInstance(events);
    return fuse.search(searchQuery).map((result) => result.item);
  };

  const filteredEvents = allEvents ? filterAndSearchEvents(allEvents) : [];

  return (
    <main className="flex-1 overflow-y-auto pb-20 px-4">
      <section className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Events</h2>
          <button
            onClick={() => setCurrentView("events")}
            className="text-sm text-indigo-400"
          >
            See All
          </button>
        </div>
        <div className="mt-4 p-4 pb-4 bg-white bg-opacity-5 rounded-lg shadow-md h-48 overflow-hidden whitespace-nowrap ">
          <div className="flex gap-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="cursor-pointer transition"
                  onClick={() => redirect(`/event?eventId=${event.eventId}`)}
                >
                  <EventCard
                    image={event.eventImage}
                    title={event.eventName}
                    date={new Date(event.eventDateTime).toLocaleDateString()}
                    location={event.eventLocation}
                  />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                <p className="text-5xl mb-2">😔</p>
                <p className="text-center text-sm">
                  Sorry, Nothing Here Just Yet
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="relative bg-indigo-600 rounded-lg p-4 flex items-center">
          <h3 className="text-5xl font-bold">🙋‍♂️</h3>
          <div>
            <h3 className="text-sm font-bold text-center ml-1 mr-3">
              Join our future events!
            </h3>
            <p className="text-sm opacity-90 text-center">Get 1 free request</p>
          </div>
          <Link href="/waitlist">
            <button className="ml-auto bg-white text-indigo-600 font-semibold py-2 px-4 rounded-md">
              Join Now
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
};

const AllEventsView = ({
  allEvents,
  searchQuery,
}: {
  allEvents: Event[] | null;
  searchQuery: string;
}) => {
  const sortedEvents =
    allEvents?.sort(
      (a, b) =>
        new Date(a.eventDateTime).getTime() -
        new Date(b.eventDateTime).getTime()
    ) || [];

  const filteredEvents = React.useMemo(() => {
    if (!searchQuery) return sortedEvents;
    const fuse = createFuseInstance(sortedEvents);
    return fuse.search(searchQuery).map((result) => result.item);
  }, [sortedEvents, searchQuery]);

  return (
    <div className="h-full overflow-y-auto px-4 pb-20 pt-3">
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.map((event) => (
          <Link key={event.eventId} href={`/event?eventId=${event.eventId}`}>
            <div
              key={event.eventId}
              className="cursor-pointer hover:bg-gray-700 transition"
            >
              <EventCard
                image={event.eventImage}
                title={event.eventName}
                date={new Date(event.eventDateTime).toLocaleDateString()}
                location={event.eventLocation}
              />
            </div>
          </Link>
        ))}
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <p className="text-5xl mb-2">😔</p>
            <p className="text-center text-sm">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserView = () => {
  const { isSignedIn } = useUser();
  const { setCurrentView } = useUIStore();

  useEffect(() => {
    if (isSignedIn) setCurrentView("explore");
  }, [isSignedIn]);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {!isSignedIn && (
        <div className="flex flex-col items-center">
          <SignIn
            routing="hash"
            appearance={{
              elements: {
                footerAction: "hidden",
                alternativeMethodsBlockButton: "text-[white]",
              },
              variables: {
                colorBackground: "#1a202c",
                colorPrimary: "rgba(86,105,255,1)",
                colorText: "white",
                colorTextSecondary: "white",
                colorTextOnPrimaryBackground: "white",
                colorInputBackground: "white",
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

const Index = () => {
  const { user } = useUser();

  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  const [eventName, setEventName] = React.useState("");
  const [eventImage, setEventImage] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [requestFee, setRequestFee] = React.useState(0);
  const [eventNameError, setEventNameError] = React.useState(false);
  const [eventImageError, setEventImageError] = React.useState(false);
  const [eventDateError, setEventDateError] = React.useState(false);
  const [eventLocationError, setEventLocationError] = React.useState(false);
  const [requestFeeError, setRequestFeeError] = React.useState(false);
  const [date, setDate] = React.useState<Date>();
  const { getToken } = useAuth();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const { toast } = useToast();

  // Get state and actions from stores
  const { events, isLoading, error, fetchEvents, addEvent } = useEventStore();
  const { currentView, searchQuery, setCurrentView, setSearchQuery } =
    useUIStore();
  const { isSignedIn } = useUser();

  // Local state for file upload functionality
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();

    // Simulate images loaded after a delay (replace with actual image loading logic)
    const timer = setTimeout(() => {
      setImagesLoaded(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [fetchEvents, setImagesLoaded]);

  const uploadFile = async () => {
    try {
      if (!selectedFile) {
        toast({
          variant: "destructive",
          title: "Missing Event Image!",
          description: `No file selected for Event Image`,
        });
        return; // Early return if no file is selected
      }

      const data = new FormData();
      data.append("file", selectedFile); // Fix: Ensure "file" matches backend key

      console.log(selectedFile);

      const s3response = await uploadFileApi(data); // Await file upload

      if (s3response && s3response.url) {
        setEventImage(s3response.url); // Set the event image URL once uploaded
      }

      return s3response.url;
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "An error occurred while trying to upload an image!",
        description: `${e}`,
      });
    }
  };

  React.useEffect(() => {
    const logoImage = new window.Image();
    logoImage.src = "/RequestLogoDark.png";
    document.ontouchmove = (event) => event.preventDefault();
    logoImage.onload = () => setImagesLoaded(true);
  }, []);

  const handleSubmit = async () => {
    try {
      // Ensure the file is uploaded before continuing
      const imageUrl = await uploadFile(); // This waits for the image upload to complete

      // Check if eventImage is set (meaning upload succeeded)

      setEventNameError(!eventName);
      setEventLocationError(!eventLocation);
      setRequestFeeError(requestFee <= 50);
      setEventDateError(!date);

      // Make sure all required fields are filled
      if (!eventName || !eventLocation || requestFee <= 50 || !date) return;

      const eventData = {
        eventName,
        eventImage: imageUrl,
        eventDateTime: date.toISOString(),
        eventLocation,
        requestFee,
        djId: user?.id || "",
      };

      const accesstoken = await getToken();
      if (!accesstoken) throw new Error("Authentication token is missing.");

      await addEvent(eventData, accesstoken);

      // Reset form after successful creation
      setEventName("");
      setEventImage("");
      setEventLocation("");
      setRequestFee(0);
      setDate(undefined);
      setImagePreview(null);
      setSelectedFile(null);

      toast({
        title: "Event Created Successfully!",
        description: "Your event has been created successfully.",
      });

        setCurrentView("explore");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        variant: "destructive",
        title: "Event Creation Failed!",
        description: `Error: ${error}`,
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  // Debug logs to help identify issues

  if (isLoading || !imagesLoaded) {
    return (
      <div className={``}>
        <Loader />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900 text-white"
      style={{ overscrollBehavior: "none", touchAction: "none" }}
    >
      {isSignedIn && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="fixed top-4 right-4 bg-indigo-600 text-white rounded-full p-2 shadow-lg z-50 w-12">
              +
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5">
              <div className="flex flex-col gap-3">
                <Label htmlFor="eventName" className="ml-1">
                  Event Name
                </Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  className={eventNameError ? "border-red-500" : ""}
                />
                {eventNameError && (
                  <p className="text-red-500">Event name is required.</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="eventImage" className="ml-1">
                  Event Image
                </Label>
                {selectedFile && imagePreview ? (
                  <div className="mb-4 items-center justify-center flex flex-col gap-5">
                    <Image
                      src={imagePreview}
                      alt="Image Preview"
                      width={100}
                      height={100}
                      className="rounded-lg"
                    />
                    <div className="flex-row flex gap-1 items-center">
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">
                          {selectedFile.name.length > 20
                            ? selectedFile.name.substring(0, 17) + "..."
                            : selectedFile.name}
                        </span>
                      </p>
                      <Button
                        className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-inherit hover:bg-inherit hover:text-white"
                        onClick={() => {
                          setImagePreview(null);
                          setSelectedFile(null);
                        }}
                      >
                        <p className="hover:text-white">X</p>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-60 border-2 border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <svg
                        className="w-5 h-5 mb-4 text-gray-500 dark:text-gray-400"
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
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif, image/svg+xml"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="eventDateTime" className="ml-1">
                  Event Date & Time
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date <= new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {eventDateError && (
                  <p className="text-red-500">Date must be in the future.</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="eventLocation" className="ml-1">
                  Event Location
                </Label>
                <Input
                  id="eventLocation"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Enter event location"
                  className={eventLocationError ? "border-red-500" : ""}
                />
                {eventLocationError && (
                  <p className="text-red-500">Location is required.</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="requestFee" className="ml-1">
                  Request Fee
                </Label>
                <Input
                  id="requestFee"
                  type="number"
                  value={requestFee == 0 ? "" : requestFee}
                  onChange={(e) => setRequestFee(Number(e.target.value))}
                  placeholder="Enter request fee (must be more than 50)"
                  className={requestFeeError ? "border-red-500" : ""}
                />
                {requestFeeError && (
                  <p className="text-red-500">
                    Fee must be more than 50 cents.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-indigo-600 text-white"
              >
                Create Event
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {!(currentView == "user") && (
        <div className="fixed top-0 left-0 right-0 z-10 bg-gray-900">
          <header className="bg-gray-900 dark:bg-gray-900 w-full py-1 px-4 flex justify-center h-14 mb-3 mt-2">
            <div className="flex items-center">
              <Image
                src="/RequestLogoDark.png"
                alt="Logo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
          </header>
          <div className="px-4 py-3 bg-gray-900">
            <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  d="M21 21l-4.35-4.35"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-sm text-gray-200 ml-2"
                style={{ fontSize: "16px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => setCurrentView("events")}
              />
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-0 pt-32 pb-16">
        {isLoading ? (
          <Loader />
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-500">
              Error loading events: {error}
              <button
                onClick={() => fetchEvents()}
                className="ml-2 text-blue-500 underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentView === "explore" ? (
              <ExploreView
                allEvents={events}
                searchQuery={searchQuery}
                setCurrentView={setCurrentView}
              />
            ) : currentView === "user" ? (
              <UserView />
            ) : (
              <AllEventsView allEvents={events} searchQuery={searchQuery} />
            )}
          </>
        )}
      </div>
      <nav className="fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 py-2 flex justify-around items-center">
        <button
          className={`flex flex-col items-center text-xs ${currentView === "explore" ? "text-white" : "text-gray-400"}`}
          onClick={() => setCurrentView("explore")}
        >
          <FaHome className="h-5 w-5 mb-1" />
          Explore
        </button>
        <button
          className={`flex flex-col items-center text-xs ${currentView === "events" ? "text-white" : "text-gray-400"}`}
          onClick={() => setCurrentView("events")}
        >
          <FaMusic className="h-5 w-5 mb-1" />
          Events
        </button>
        {isSignedIn ? (
          <UserButton />
        ) : (
          <button
            className="flex flex-col items-center text-xs text-gray-400"
            onClick={() => (isSignedIn ? null : setCurrentView("user"))}
          >
            <FaUser className="h-5 w-5 mb-1" />
          </button>
        )}
      </nav>
    </div>
  );
};

export default Index;
