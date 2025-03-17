import { NextResponse, type NextRequest } from "next/server";

// ==================== TYPES ====================

export interface EventData {
  eventName: string;
  eventImage: string;
  eventDateTime: string; // Use ISO string for serialization
  eventLocation: string;
  requestFee: number;
  djId: string; // Use the user's Clerk user ID
}

// Request status constants
export const REQUEST_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  PLAYED: 'played'
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export interface RequestBody {
  songName: string;
  songArtist: string;
  songImage: string;
  userId: string | null;
  eventId: string;
  paymentId: string;
  status?: RequestStatus; // Make it optional with the defined type
  payment?: { amount: number } | null;
}

// ==================== EVENT MANAGEMENT ====================

// Fetch all events
export const fetchAllEvents = async () => {
  const response = await fetch("/api/events/all", { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
};

// Fetch a single event by ID
export const fetchEventById = async (eventId: string) => {
  const response = await fetch(`/api/events/getById?eventId=${eventId}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Failed to fetch event");
  return response.json();
};

// Create a new event
export const createEvent = async (
  eventData: EventData,
  accessToken: string
) => {
  const response = await fetch("/api/events/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to create event: ${errorData.error || "Unknown error"}`
    );
  }
  
  const createdEvent = await response.json();
  
  // After creating the event, add the DJ to the event
  await addDJToEvent(createdEvent.eventId, eventData.djId, accessToken);
  
  return createdEvent;
};

// Update an event
export const updateEvent = async (
  eventId: string,
  eventData: Partial<EventData>,
  accessToken: string
) => {
  const response = await fetch(`/api/events/update?eventId=${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) throw new Error("Failed to update event");
  return response.json();
};

// Delete Event
export const deleteEvent = async (eventId: string, accessToken: string) => {
  const response = await fetch(`/api/events/delete?eventId=${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Failed to delete event");
  return response.json();
};

// ==================== DJ MANAGEMENT ====================

// Fetch DJ details by ID
export const fetchDjById = async (djId: string) => {
  const response = await fetch(`/api/djs/getById?djId=${djId}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Failed to fetch DJ");
  return response.json();
};

// Fetch all DJs
export const fetchAllDJs = async (accessToken: string) => {
  const response = await fetch(`/api/djs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch DJs");
  return response.json();
};

// Create a new DJ
export const createDJ = async (
  djData: {
    djId: string;
    djName: string;
    djEmail: string;
    djInsta?: string;
    djPhone?: string;
    djImageUrl?: string;
  },
  accessToken: string
) => {
  const response = await fetch(`/api/djs/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(djData),
  });
  if (!response.ok) throw new Error("Failed to create DJ");
  return response.json();
};

// Update DJ information
export const updateDJ = async (
  djId: string,
  djData: Partial<{
    djName: string;
    djEmail: string;
    djInsta: string;
    djPhone: string;
    djImageUrl: string;
  }>,
  accessToken: string
) => {
  const response = await fetch(`/api/djs/update?djId=${djId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(djData),
  });
  if (!response.ok) throw new Error("Failed to update DJ");
  return response.json();
};

// ==================== EVENT-DJ MANAGEMENT ====================

// Set the active DJ for an event
export const setEventActiveDJ = async (
  eventId: string,
  djId: string,
  accessToken: string
) => {
  const response = await fetch(`/api/events/${eventId}/active-dj`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ djId }),
  });
  if (!response.ok) throw new Error("Failed to set active DJ");
  return response.json();
};

// Add a DJ to an event (many-to-many relationship)
export const addDJToEvent = async (
  eventId: string,
  djId: string,
  accessToken: string
) => {
  const response = await fetch(`/api/events/${eventId}/add-dj`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ djId }),
  });
  if (!response.ok) throw new Error("Failed to add DJ to event");
  return response.json();
};

// Get all DJs for an event
export const getEventDJs = async (eventId: string, accessToken: string) => {
  const response = await fetch(`/api/events/${eventId}/djs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch event DJs");
  return response.json();
};

// Remove a DJ from an event
export const removeDJFromEvent = async (
  eventId: string,
  djId: string,
  accessToken: string
) => {
  const response = await fetch(`/api/events/${eventId}/djs/${djId}?checkForDelete=true`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error("Failed to remove DJ from event");
  return response.json();
};

// ==================== REQUEST MANAGEMENT ====================

// Fetch song requests for an event
export const fetchRequestsByEventId = async (eventId: string) => {
  const response = await fetch(`/api/requests/getByEvent?eventId=${eventId}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Failed to fetch requests");
  return response.json();
};

// Create a song request
export const createRequest = async (requestBody: RequestBody) => {
  const response = await fetch("/api/requests/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to create request: ${errorData.error || "Unknown error"}`
    );
  }
  return response.json();
};

// Accept a request
export const acceptRequest = async (requestId: string, accessToken: string) => {
  const response = await fetch(`/api/requests/accept?requestId=${requestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Failed to accept request");
  return response.json();
};

// Cancel a request
export const cancelRequest = async (requestId: string, pi: string) => {
  const response = await fetch(
    `/api/requests/cancel-request?requestId=${requestId}&pi=${pi}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) throw new Error("Failed to cancel request");
  return response.json();
};

// Mark a request as played
export const markRequestAsPlayed = async (
  requestId: string,
  accessToken: string
) => {
  const response = await fetch(`/api/requests/played?requestId=${requestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Failed to mark request as played");
  return response.json();
};

// Decline a request
export const declineRequest = async (
  requestId: string,
  accessToken: string,
  paymentId: string
) => {
  // await sendDeclinedRequestEmail(requestId, paymentId);

  const response = await fetch(`/api/requests/declined?requestId=${requestId}&pi=${paymentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Failed to decline request");
  return response.json();
};

// Update request status
export const updateRequestStatus = async (paymentId: string, status: string) => {
  const response = await fetch(`/api/requests/update-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentId, status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update request status: ${errorData.error || "Unknown error"}`);
  }
  return response.json();
};

// ==================== PAYMENT HANDLING ====================

// Fetch a payment intent
export const fetchPaymentIntent = async (
  amount: number,
  currency: string,
  requestId: string
) => {
  const response = await fetch(`/api/stripe/createPaymentIntent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currency, amount, requestId }),
  });

  if (!response.ok) throw new Error("Failed to fetch payment intent");
  return response.json();
};

// Create a payment
export const createPayment = async (paymentData: {
  paymentId: string;
  amount: number;
  djId: string;
  email: string;
  phone: string;
}) => {
  const response = await fetch("/api/payment/createPayment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create payment");
  }
  return response.json();
};

// Capture a payment intent
export const capturePaymentIntent = async (
  paymentId: string,
  amount: number
) => {
  const response = await fetch(`/api/stripe/capturePaymentIntent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ intentId: paymentId, capture: amount }),
  });

  if (!response.ok) throw new Error("Failed to capture payment intent");
  return response.json();
};

// Fetch a payment by ID
export const fetchPaymentById = async (paymentId: string) => {
  const response = await fetch(`/api/payment/${paymentId}`);
  if (!response.ok) throw new Error("Failed to fetch payment details");
  return response.json();
};

// Confirm free order
export const freeOrderConfirm = async (phone: string, pi: string) => {
  const response = await fetch(`/api/twilio/freeOrderConfirmed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ freePaymentId: pi, phone: phone }),
  });

  if (!response.ok) throw new Error("Failed to confirm request");
  return response.json();
};

// ==================== FILE MANAGEMENT ====================

// Upload file to S3
export const uploadFileApi = async (formData: FormData) => {
  const response = await fetch("/api/s3/upload", {
    method: "POST",
    body: formData, // No need for headers; `fetch` sets it automatically
  });

  if (!response.ok) throw new Error("Failed to upload file");
  return response.json();
};

// Fetch file from Pinata
export const fetchFileApi = async (cid: string) => {
  const response = await fetch("/api/pinata/fetchFile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cid: cid }),
  });

  if (!response.ok) throw new Error("Failed to upload file");

  const blob = await response.blob(); // Convert response to a Blob
  return blob; // Return the Blob
};

// ==================== AUTHENTICATION ====================

// Fetch Spotify authentication
export const spotifyAuth = async () => {
  const response = await fetch(`/api/spotify/auth`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("Failed to fetch Spotify auth");
  return response.json();
};

// ==================== NOTIFICATION SERVICES ====================

// Send a declined request notification email
export const sendDeclinedRequestEmail = async (requestId: string, paymentId: string) => {
  const response = await fetch(`/api/twilio/requestDeclined`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestId, paymentId }),
  });

  return response.json();
};

// ==================== WAITLIST MANAGEMENT ====================

// Check if an email exists in the waitlist
export const checkEmail = async (email: string) => {
  const response = await fetch(`/api/waitlist/check-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) throw new Error("Error checking email");
  return response.json();
};

// Check if a phone number exists in the waitlist
export const checkPhone = async (phone: string) => {
  const response = await fetch(`/api/waitlist/check-phone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) throw new Error("Error checking phone number");
  return response.json();
};

// Submit email to the waitlist
export const submitEmailToWaitlist = async (emailData: {
  email: string;
  eventId: string;
  songRequested: string;
}) => {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) throw new Error("Failed to submit email to waitlist");
  return response.json();
};


