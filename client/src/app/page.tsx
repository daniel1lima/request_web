"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { notFound, redirect, useRouter } from "next/navigation";
import "./globals.css";
import EventCard from "@/components/event/EventCard";
import { FaHome, FaMusic, FaUser } from "react-icons/fa";
import Link from "next/link";
import Fuse from "fuse.js";
import { useUser, SignIn, UserButton } from "@clerk/nextjs";
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
import { fetchAllEvents, createEvent } from "@/api/apiService";

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
}

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
    <div className="loader text-white">
      <Image
        src="/RequestLogoLight.png"
        alt="DJ Request Logo"
        width={200}
        height={200}
        className="invert dark:invert"
        priority
        style={{ objectFit: "contain" }}
      />
    </div>
  </div>
);

// Add this helper function after the Event interface
const createFuseInstance = (events: Event[]) => {
  return new Fuse(events, {
    keys: ["eventName", "eventLocation"],
    threshold: 0.4, // Lower = more strict matching
    location: 0,
    distance: 100,
    minMatchCharLength: 2,
  });
};

// Components for different views
const ExploreView = ({
  allEvents,
  searchQuery,
  setCurrentView,
}: {
  allEvents: Event[] | null;
  searchQuery: string;
  setCurrentView: (view: "explore" | "events") => void;
}) => {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // const [isMobile, setIsMobile] = useState(false);

  // Add useEffect to detect mobile device
  // useEffect(() => {
  //   const handleResize = () => {
  //     setIsMobile(window.innerWidth < 768); // Adjust the width as needed for mobile detection
  //   };

  //   handleResize(); // Check on initial load
  //   window.addEventListener("resize", handleResize);

  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, []);

  const filterAndSearchEvents = (events: Event[]) => {
    if (!searchQuery) return events;
    const fuse = createFuseInstance(events);
    return fuse.search(searchQuery).map((result) => result.item);
  };

  const currentEvents = allEvents?.filter((event: Event) => {
    const eventDate = new Date(event.eventDateTime);
    return eventDate >= now && eventDate <= next24Hours;
  });

  const futureEvents = allEvents?.filter((event: Event) => {
    const eventDate = new Date(event.eventDateTime);
    return eventDate > next24Hours;
  });

  const filteredCurrentEvents = currentEvents
    ? filterAndSearchEvents(currentEvents)
    : [];
  const filteredFutureEvents = futureEvents
    ? filterAndSearchEvents(futureEvents)
    : [];

  return (
    <main className="flex-1 overflow-y-auto pb-20 px-4">
      {/* Current Events */}
      <section className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Events Right Now</h2>
          <button
            onClick={() => setCurrentView("events")}
            className="text-sm text-indigo-400"
          >
            See All
          </button>
        </div>

        {/* Events grid or list */}
        <div className="mt-4 p-4 pb-4 bg-white bg-opacity-5 rounded-lg shadow-md h-48 overflow-hidden whitespace-nowrap ">
          <div className="flex gap-4">
            {filteredCurrentEvents.length > 0 ? (
              filteredCurrentEvents.map((event) => {
                return (
                  <div
                    key={event.eventId}
                    className="cursor-pointer transition"
                    onClick={() => {
                      redirect(`/event?eventId=${event.eventId}`);
                    }}
                  >
                    <EventCard
                      image={event.eventImage}
                      title={event.eventName}
                      date={new Date(event.eventDateTime).toLocaleDateString()}
                      location={event.eventLocation}
                    />
                  </div>
                );
              })
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

      {/* Invite friends banner */}
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

      {/* Events After 24 Hours */}
      {false && (
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Events Coming Soon</h2>
            <button
              onClick={() => setCurrentView("events")}
              className="text-sm text-indigo-400"
            >
              See All
            </button>
          </div>

          {/* Events grid or list */}
          <div className="mt-4 p-4 bg-white bg-opacity-5 rounded-lg shadow-md h-58 overflow-x-auto whitespace-nowrap ">
            <div className="flex gap-4">
              {filteredFutureEvents.length > 0 ? (
                filteredFutureEvents.map((event) => (
                  <Link key={event.eventId} href={`/event?eventId=${event.eventId}`}>
                    <div
                      key={event.eventId}
                      className="inline-block cursor-pointer  transition"
                    >
                      <EventCard
                        image={event.eventImage}
                        title={event.eventName}
                        date={new Date(
                          event.eventDateTime
                        ).toLocaleDateString()}
                        location={event.eventLocation}
                      />
                    </div>
                  </Link>
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
      )}
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

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return sortedEvents;
    const fuse = createFuseInstance(sortedEvents);
    return fuse.search(searchQuery).map((result) => result.item);
  }, [sortedEvents, searchQuery]);

  return (
    <div className="h-full overflow-y-auto px-4 pb-20 pt-3">
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.map((event) => (
          <Link  key={event.eventId} href={`/event?eventId=${event.eventId}`}>
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

// UserView component
const UserView = () => {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      redirect("/");
    }
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[] | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<"explore" | "events" | "user">(
    "explore"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn, user } = useUser();
  const [eventName, setEventName] = useState("");
  const [eventImage, setEventImage] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [requestFee, setRequestFee] = useState(0);
  const [eventNameError, setEventNameError] = useState(false);
  const [eventImageError, setEventImageError] = useState(false);
  const [eventDateError, setEventDateError] = useState(false);
  const [eventLocationError, setEventLocationError] = useState(false);
  const [requestFeeError, setRequestFeeError] = useState(false);
  const [date, setDate] = React.useState<Date>();

  // Add new useEffect for image preloading
  useEffect(() => {
    const logoImage = new window.Image();
    logoImage.src = "/RequestLogoDark.png";

    document.ontouchmove = function (event) {
      event.preventDefault();
    };

    Promise.all([
      new Promise((resolve) => {
        logoImage.onload = resolve;
      }),
    ]).then(() => {
      setImagesLoaded(true);
    });
  }, []);

  useEffect(() => {
    console.log(date);
  }, [date]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchAllEvents();

        if (!data || data.error) {
          console.error("Error fetching event data:", data?.error || "No data");
          notFound()
        }

        localStorage.setItem("allEvents", JSON.stringify(data));
        setAllEvents(data);
        setFadeOut(true);
        setTimeout(() => {
          setLoading(false);
        }, 200);
      } catch (error) {
        console.error("Error fetching event details:", error);
        notFound()
      }
    };

    loadEvents();
  }, [router]);

  const handleSubmit = async () => {
    // Reset error states
    setEventNameError(false);
    setEventImageError(false);
    setEventDateError(false);
    setEventLocationError(false);
    setRequestFeeError(false);

    // Validation flags
    let isValid = true;

    // Validate Event Name
    if (!eventName) {
      setEventNameError(true);
      isValid = false;
    }

    // Validate Event Image URL
    if (!eventImage) {
      setEventImageError(true);
      isValid = false;
    }

    // Validate Event Location
    if (!eventLocation) {
      setEventLocationError(true);
      isValid = false;
    }

    // Validate Request Fee
    if (requestFee <= 50) {
      setRequestFeeError(true);
      isValid = false;
    }

    // If any validation fails, prevent submission
    if (!isValid) {
      return;
    }

    if (!date) {
      setEventDateError(true);
      return; // Prevent submission if date is not set
    }

    // Define eventData here
    const eventData = {
      eventName,
      eventImage,
      eventDateTime: date ? date : new Date(), // Use current date if date is null
      eventLocation,
      requestFee,
      djId: user?.id || "", // Default to an empty string if user?.id is undefined
    };

    setLoading(true);

    try {
      const response = await createEvent(eventData);
      if (response.ok) {
        console.log("Event created successfully:", response);
        // Optionally reset form fields after successful submission
        setEventName("");
        setEventImage("");
        setEventLocation("");
        setRequestFee(0);
        setDate(undefined); // Reset date

        // Close the dialog after a short delay
        setTimeout(() => {
          setLoading(false);
          setFadeOut(true); // Trigger fade out effect
        }, 1000); // Adjust delay as needed
      } else {
        console.error("Failed to create event:", response);
      }
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false); // Ensure loading state is reset
    }
  };

  if (loading || !imagesLoaded) {
    return (
      <div
        className={`transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      >
        <Loader />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900 text-white"
      style={{
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      {/* Conditional Dialog Button */}
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
            <div className="grid gap-4">
              <div>
                <Label htmlFor="eventName">Event Name</Label>
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
              <div>
                <Label htmlFor="eventImage">Event Image URL</Label>
                <Input
                  id="eventImage"
                  value={eventImage}
                  onChange={(e) => setEventImage(e.target.value)}
                  placeholder="Enter event image URL"
                  className={eventImageError ? "border-red-500" : ""}
                />
                {eventImageError && (
                  <p className="text-red-500">Image URL is required.</p>
                )}
              </div>
              <div>
                <Label htmlFor="eventDateTime">Event Date & Time</Label>
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
              <div>
                <Label htmlFor="eventLocation">Event Location</Label>
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
              <div>
                <Label htmlFor="requestFee">Request Fee</Label>
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
            {loading && <div className="loader">Loading...</div>}
          </DialogContent>
        </Dialog>
      )}
      {/* Fixed header and search section */}
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

          {/* Search bar */}
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

      {/* Content area */}
      <div className="absolute inset-0 pt-32 pb-16">
        {currentView === "explore" ? (
          <ExploreView
            allEvents={allEvents}
            searchQuery={searchQuery}
            setCurrentView={setCurrentView}
          />
        ) : currentView === "user" ? (
          <UserView />
        ) : (
          <AllEventsView allEvents={allEvents} searchQuery={searchQuery} />
        )}
      </div>

      {/* Bottom nav bar */}
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
