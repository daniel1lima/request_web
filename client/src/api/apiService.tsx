

// TYPES

export interface EventData {
  eventName: string;
  eventImage: string;
  eventDateTime: string; // Use ISO string for serialization
  eventLocation: string;
  requestFee: number;
  djId: string; // Use the user's Clerk user ID
}

export interface RequestBody {
  songName: string;
  songArtist: string;
  songImage: string;
  userId: string | null;
  eventId: string;
  paymentId: string;
}

// Fetch all events
export const fetchAllEvents = async () => {
  const response = await fetch("/api/events/all", { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
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

// Fetch a single event by ID
export const fetchEventById = async (eventId: string) => {
  const response = await fetch(`/api/events/getById?eventId=${eventId}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Failed to fetch event");
  return response.json();
};

// Fetch DJ details by ID
export const fetchDjById = async (djId: string) => {
  const response = await fetch(`/api/djs/getById?djId=${djId}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Failed to fetch DJ");
  return response.json();
};

// Fetch song requests for an event
export const fetchRequestsByEventId = async (eventId: string) => {
  const response = await fetch(`/api/requests/getByEvent?eventId=${eventId}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Failed to fetch requests");
  return response.json();
};

// Create a new event
export const createEvent = async (eventData: EventData, accessToken: string) => {
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
    throw new Error(`Failed to create event: ${errorData.error || "Unknown error"}`);
  }
  return response.json();
};

// Fetch a payment intent
export const fetchPaymentIntent = async (amount: number, currency: string, requestId: string) => {
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
export const createPayment = async (paymentData: { paymentId: string; amount: number; djId: string }) => {
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
    throw new Error(`Failed to create request: ${errorData.error || "Unknown error"}`);
  }
  return response.json();
};

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

// Submit email to the waitlist
export const submitEmailToWaitlist = async (emailData: { email: string; eventId: string; songRequested: string }) => {
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
  const response = await fetch(`/api/requests/cancel-request?requestId=${requestId}&pi=${pi}`, {
    method: "GET",
  });

  if (!response.ok) throw new Error("Failed to cancel request");
  return response.json();
};

// Cancel a request
export const freeOrderConfirm = async (email: string, pi: string) => {
  const response = await fetch(`/api/mailgun/freeOrderConfirmed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({freePaymentId: pi, email: email})
  });

  if (!response.ok) throw new Error("Failed to confirm request");
  return response.json();
};

// Capture a payment intent
export const capturePaymentIntent = async (paymentId: string, amount: number) => {
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

// Mark a request as played
export const markRequestAsPlayed = async (requestId: string, accessToken: string) => {
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
export const declineRequest = async (requestId: string, accessToken: string) => {
  const response = await fetch(`/api/requests/delete?requestId=${requestId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Failed to decline request");
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

// Fetch a payment by ID
export const fetchPaymentById = async (paymentId: string) => {
  const response = await fetch(`/api/payment/${paymentId}`);
  if (!response.ok) throw new Error("Failed to fetch payment details");
  return response.json();
};

// Fetch Spotify authentication
export const spotifyAuth = async () => {
  const response = await fetch(`/api/spotify/auth`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("Failed to fetch Spotify auth");
  return response.json();
};
