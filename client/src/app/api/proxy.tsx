import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const { path } = req.query;
  
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/${path}`, {
      method: req.method,
      headers: {
        ...Object.fromEntries(
          Object.entries(req.headers).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value
          ])
        ),
        'x-api-key': process.env.API_KEY!,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
  
    const data = await backendResponse.json();
    res.status(backendResponse.status).json(data);
  }
  