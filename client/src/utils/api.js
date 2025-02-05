const API_URL = process.env.NEXT_PUBLIC_API_URL; // Base URL for your API

const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        method: options.method || 'GET',
    });

    if (!response.ok) {
        const errorMessage = await response.text(); // Get the error message from the response
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
    }

    // For DELETE requests, we might not have a response body
    if (options.method === 'DELETE') {
        return { success: true };
    }

    // const contentType = response.headers.get("content-type");
    // if (contentType && contentType.includes("application/json")) {
    //     return response.json();
    // }
    
    // If we get here, return the raw response text
    return response;
};

export default apiFetch; 