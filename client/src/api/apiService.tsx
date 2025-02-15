import apiFetch from "@/utils/api";

// TYPES

export interface eventData {
    eventName: string,
    eventImage: string,
    eventDateTime: Date, // Convert to ISO string
    eventLocation: string,
    requestFee: number,
    djId: string, // Use the user's Clerk user ID
};

export interface requestBody {
  songName: string;
  songArtist: string;
  songImage: string;
  userId: string | null;
  eventId: string;
  paymentId: string;
}



export const fetchAllEvents = async () => {
    const response = await apiFetch('/events/all');
    return await response.json();
};

export const fetchEventById = async (eventId: string) => {
    const response = await apiFetch(`/events/getById?eventId=${eventId}`);
    return await response.json()
};

export const fetchDjById = async (djId: string) => {
    const response = await apiFetch(`/djs/getById?djId=${djId}`);
    return await response.json();
};
export const fetchRequestsByEventId = async (eventId: string) => {
    const response = await apiFetch(`/requests/getByEvent?eventId=${eventId}`);
    return await response.json();
};

export const createEvent = async (eventData: eventData) => {
    const response = await apiFetch('/events/create', {
        method: 'POST',
        body: JSON.stringify(eventData),
    });
    return await response.json();
};

// New API functions
export const fetchPaymentIntent = async (amount: number, currency: string) => {
    const response = await apiFetch(`/stripe/createPaymentIntent?amount=${amount}&currency=${currency}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch payment intent");
    }
    return await response.json();
};

export const createPayment = async (paymentData: { paymentId: string, amount: number, djId: string }) => {
    const response = await apiFetch("/payment/createPayment", {
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
    return await response.json();
};

export const createRequest = async (requestBody: { songName: string, songArtist: string, songImage: string, userId: string | null, eventId: string, paymentId: string }) => {
    const response = await apiFetch("/requests/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
    }
    return await response.json();
};

export const checkEmail = async (email: string) => {
    const response = await apiFetch(`/waitlist/check-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error checking email");
    }
    return await response.json();
};

export const submitEmailToWaitlist = async (emailData: { email: string, eventId: string, songRequested: string }) => {
    const response = await apiFetch("/waitlist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit email to waitlist");
    }
    return await response.json();
};

export const acceptRequest = async (requestId: string) => {
    const response = await apiFetch(`/requests/accept?requestId=${requestId}`, {
        method: "PUT",
    });
    if (!response.ok) {
        throw new Error("Failed to accept request");
    }
    return await response.json();
};

export const capturePaymentIntent = async (paymentId: string, amount: number) => {
    const response = await apiFetch(`/stripe/capturePaymentIntent?intentId=${paymentId}&capture=${amount}`, {
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to capture payment intent");
    }
    return await response.json();
};

export const markRequestAsPlayed = async (requestId: string) => {
    const response = await apiFetch(`/requests/played?requestId=${requestId}`, {
        method: "PUT",
    });
    if (!response.ok) {
        throw new Error("Failed to mark request as played");
    }
    return await response.json();
};

export const declineRequest = async (requestId: string) => {
    const response = await apiFetch(`/requests/delete?requestId=${requestId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to decline request");
    }
    return await response.json();
};

export const fetchPaymentById = async (paymentId: string) => {
    const response = await apiFetch(`/payment/${paymentId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch payment details");
    }
    return await response.json();
};

// Add more common API functions as needed