const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:65534';

export const api = {
  checkDbConnection: async (): Promise<string> => {
    const response = await fetch(`${API_BASE}/check-db-connection`);
    return response.text();
  },

  getDemoTable: async () => {
    const response = await fetch(`${API_BASE}/demotable`);
    const json = await response.json();
    return json.data || json;
  },

  insertDemoTable: async (id: string, name: string) => {
    const response = await fetch(`${API_BASE}/insert-demotable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, name }),
    });
    return response.json();
  }
}; 