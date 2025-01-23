'use client';

import { useEffect, useState } from 'react';
import { DemoTable } from '@/components/DemoTable';
import { api } from '@/lib/api';
import { DemoTableRow } from '@/types';

export default function Home() {
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

  console.log(tableData)

  return (
    <main className="min-h-screen p-24 bg-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">
          Database Connection Status: {dbStatus}
        </h1>
        <h2 className="text-2xl font-semibold mb-4 text-white">DemoTable Data</h2>
        <DemoTable 
          data={tableData}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </main>
  );
}
