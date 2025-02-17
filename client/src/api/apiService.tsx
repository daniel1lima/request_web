import { useAuth } from "@clerk/clerk-react"; // Import Clerk SDK

// TYPES

export interface eventData {
  eventName: string;
  eventImage: string;
  eventDateTime: Date; // Convert to ISO string
  eventLocation: string;
  requestFee: number;
  djId: string; // Use the user's Clerk user ID
}

export interface requestBody {
  songName: string;
  songArtist: string;
  songImage: string;
  userId: string | null;
  eventId: string;
  paymentId: string;
}

// Custom hook to get the Clerk token
export const useAuthToken = () => {
  const { getToken } = useAuth();
  return getToken; // Return the ID token
};


export const fetchAllEvents = async () => {
  const response = await fetch("/api/events/all", { next: { revalidate: 60 } }); // Cache for 60 seconds
  return await response.json();
};

export const updateEvent = async (eventId: string, eventData: any, accessToken) => {
  const response = await fetch(
    `/api/events/update?eventId=${eventId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Include the token in the headers
      },
      body: JSON.stringify({
        eventId,
        ...eventData,
      }),
    }
  );
  
  if (!response) {
    throw new Error("Failed to update event");
  }
  return await response.json();
};

export const fetchEventById = async (eventId: string) => {
  const response = await fetch(`/api/events/getById?eventId=${eventId}`, { next: { revalidate: 60 } }); // Cache for 60 seconds
  return await response.json();
};

export const fetchDjById = async (djId: string) => {
  const response = await fetch(`/api/djs/getById?djId=${djId}`, { next: { revalidate: 60 } }); // Cache for 60 seconds
  return await response.json();
};

export const fetchRequestsByEventId = async (eventId: string) => {
  const response = await fetch(`/api/requests/getByEvent?eventId=${eventId}`, { next: { revalidate: 60 } }); // Cache for 60 seconds
  return await response.json();
};

export const createEvent = async (eventData: eventData, accessToken) => {
  const response = await fetch("/api/events/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`, // Include the token in the headers
    },
    body: JSON.stringify(eventData),
  });
  if (!response) {
    const errorData = await response.json();
    throw new Error(`Failed to create event: ${response.status} ${response.statusText} - ${errorData.error || "Unknown error"}`);
  }
  return await response.json();
};

// New API functions
export const fetchPaymentIntent = async (amount: number, currency: string) => {
  const response = await fetch(
    `/api/stripe/createPaymentIntent?amount=${amount}&currency=${currency}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response) {
    throw new Error("Failed to fetch payment intent");
  }
  return await response.json();
};

export const createPayment = async (paymentData: {
  paymentId: string;
  amount: number;
  djId: string;
}) => {
  const response = await fetch("/api/payment/createPayment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });
  if (!response) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create payment");
  }
  return await response.json();
};

export const createRequest = async (requestBody: {
  songName: string;
  songArtist: string;
  songImage: string;
  userId: string | null;
  eventId: string;
  paymentId: string;
}) => {
  const response = await fetch("/api/requests/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  if (!response) {
    const errorData = await response.json();
    throw new Error(`Failed to create request: ${response.status} ${response.statusText} - ${errorData.error || "Unknown error"}`);
  }
  return await response.json();
};

export const checkEmail = async (email: string) => {
  const response = await fetch(`/api/waitlist/check-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  if (!response) {
    const errorData = await response.json();
    throw new Error(`Error checking email: ${response.status} ${response.statusText} - ${errorData.error || "Unknown error"}`);
  }
  return await response.json();
};

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
  if (!response) {
    const errorData = await response.json();
    throw new Error(`Failed to submit email to waitlist: ${response.status} ${response.statusText} - ${errorData.error || "Unknown error"}`);
  }
  return await response.json();
};

export const acceptRequest = async (requestId: string, accessToken) => {
  const response = await fetch(`/api/requests/accept?requestId=${requestId}`, {
    method: "PUT",
    headers: {
        Authorization: `Bearer ${accessToken}`,
    }
  });
  if (!response) {
    throw new Error("Failed to accept request");
  }
  return await response.json();
};

export const capturePaymentIntent = async (
  paymentId: string,
  amount: number
) => {
  const response = await fetch(
    `/api/stripe/capturePaymentIntent?intentId=${paymentId}&capture=${amount}`,
    {
      method: "POST",
    }
  );
  if (!response) {
    throw new Error("Failed to capture payment intent");
  }
  return await response.json();
};

export const markRequestAsPlayed = async (requestId: string, accessToken) => {
  const response = await fetch(`/api/requests/played?requestId=${requestId}`, {
    method: "PUT",
    headers: {
        Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response) {
    throw new Error("Failed to mark request as played");
  }
  return await response.json();
};

export const declineRequest = async (requestId: string, accessToken) => {
  const response = await fetch(`/api/requests/delete?requestId=${requestId}`, {
    method: "DELETE",
    headers: {
        Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response) {
    throw new Error("Failed to decline request");
  }
  return await response.json();
};

export const fetchPaymentById = async (paymentId: string) => {
  const response = await fetch(`/api/payment/${paymentId}`);
  if (!response) {
    throw new Error("Failed to fetch payment details");
  }
  return await response.json();
};

export const spotifyAuth = async () => {
    const response = await fetch(`/api/spotify/auth`, {
        headers: {
            Accept: "application/json",
          },
    }
    );
    if (!response) {
      throw new Error("Failed to fetch spotify auth");
    }
    return await response.json();
  };

