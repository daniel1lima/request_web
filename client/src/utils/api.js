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

    const data = await response.json();
    return {
        ok: true,
        json: () => Promise.resolve(data),
        ...data
    };
};

export default apiFetch; 