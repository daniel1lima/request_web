'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import { SongForm } from './SongForm';
import { EmptyState } from './EmptyState';
import { ThemeToggle } from '../theme-toggle';

export const RequestSong = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);

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

  const handleSongSelect = (selected: boolean) => {
    setShowHeader(!selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-gray-900 max-w-[480px] w-full min-h-screen overflow-x-hidden">
      {/* Logo and Title Sections with animation */}
      <div 
        className={`transition-all duration-500 ease-in-out transform ${
          showHeader 
            ? 'opacity-100 translate-y-0 max-h-[200px] mb-12' 
            : 'opacity-0 -translate-y-12 max-h-0 mb-0'
        }`}
      >
        {/* Logo Section */}
        <div className="flex justify-center pt-6 pb-2 px-4">
          <Image
            src="/RequestLogoLight.png"
            alt="DJ Request Logo"
            width={120}
            height={40}
            className="dark:invert"
          />
        </div>

        {/* Title Section */}
        <div className="flex flex-col w-full text-center pb-6 px-4">
          <h1 className="relative font-bold text-[32px] tracking-tight text-gray-900 dark:text-white">
            Request a Song
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Find and request your favorite tracks
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div 
        className={`flex w-full flex-col px-4 transition-all duration-500 ease-in-out ${
          !showHeader ? 'mt-10' : 'mt-0'
        }`}
      >
        <SongForm 
          accessToken={accessToken} 
          onSongSelect={handleSongSelect}
        />
      </div>
    </div>
  );
};