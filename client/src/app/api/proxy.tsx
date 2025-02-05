export default async function handler(req: any, res: any) {
    const { path } = req.query;
  
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/${path}`, {
      method: req.method,
      headers: {
        ...req.headers,
        'x-api-key': process.env.API_KEY!,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
  
    const data = await backendResponse.json();
    res.status(backendResponse.status).json(data);
  }
  