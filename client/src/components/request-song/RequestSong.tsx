'use client'

import React, { useEffect, useState } from 'react';

import { SongForm } from './SongForm';
import { EmptyState } from './EmptyState';
import { ThemeToggle } from '../theme-toggle';

export const RequestSong = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getSpotifyToken = async () => {
    try {
      const response = await fetch('/api/spotify/auth', {
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.error) {
        console.error('Error from backend:', data.error);
        return;
      }

      console.log('Token received');
      setAccessToken(data.access_token);
    } catch (error) {
      console.log('Error fetching Spotify token:', error);
    }
  };

  useEffect(() => {
    getSpotifyToken();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 max-w-[480px] w-full h-screen overflow-auto">
            <div className="flex flex-col w-full text-center pb-3 pt-6">
            <h1 className="relative text-transparent text-[25px] font-normal bg-gradient-to-r from-red-500 to-blue-300 bg-clip-text leading-[1.2]">
              Request a Song
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-900 z-10 flex w-full flex-col items-stretch">
            <div className="flex w-full flex-col items-stretch px-3.5">
              <SongForm accessToken={accessToken} />
            </div>
          </div>
      </div>

  );
};