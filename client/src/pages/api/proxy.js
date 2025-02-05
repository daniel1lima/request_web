
import '../../envConfig.ts'

export default async function handler(req, res) {
    const apiKey = process.env.API_KEY; // Use a server-side environment variable

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key is not defined' });
    }

    const url = `${process.env.NEXT_PUBLIC_URL}` + req.query.endpoint;

    const options = {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey, // Include the API key here
        },
    };

    // Include the body only for POST requests
    if (req.method === 'POST') {
        options.body = JSON.stringify(req.body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error fetching from external API:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
} 