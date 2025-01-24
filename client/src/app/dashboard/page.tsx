'use client';

import { useEffect, useState } from 'react';
import { DemoTable } from '@/components/DemoTable';
import { api } from '@/lib/api';
import { DemoTableRow } from '@/types';

export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState<string>('checking...');
  const [tableData, setTableData] = useState<DemoTableRow[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [status, data] = await Promise.all([
          api.checkDbConnection(),
          api.getDemoTable()
        ]);
        
        setDbStatus(status);
        
        if (Array.isArray(data)) {
          setTableData(data);
        } else {
          setError('Invalid data format received');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <main className="p-4">
      <h1>Dashboard</h1>
      <p>Database Status: {dbStatus}</p>
      <DemoTable data={tableData} isLoading={isLoading} error={error} />
    </main>
  );
} 