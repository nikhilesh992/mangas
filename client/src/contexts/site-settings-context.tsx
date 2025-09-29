import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { SiteSetting } from '@/lib/types';

interface SiteSettingsContextType {
  settings: Record<string, string>;
  getSetting: (key: string, defaultValue?: string) => string;
  isLoading: boolean;
  refresh: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [sseConnected, setSseConnected] = useState(false);

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
    refetchInterval: sseConnected ? false : 10000, // Only poll if SSE not connected
  });

  // Setup Server-Sent Events for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/settings/stream');

    eventSource.onopen = () => {
      console.log('SSE connected for real-time settings updates');
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'settings' || data.type === 'settings_update') {
          // Process settings data immediately
          const settingsMap = data.settings.reduce((acc: Record<string, string>, setting: SiteSetting) => {
            if (setting.key && setting.value) {
              acc[setting.key] = setting.value;
            }
            return acc;
          }, {} as Record<string, string>);
          
          setSettings(settingsMap);
          
          // Apply dynamic CSS variables for theme
          if (settingsMap.primary_color) {
            document.documentElement.style.setProperty('--primary-color', settingsMap.primary_color);
          }
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.warn('SSE connection error, falling back to polling:', error);
      setSseConnected(false);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setSseConnected(false);
    };
  }, []);

  useEffect(() => {
    if (settingsData) {
      const settingsMap = settingsData.reduce((acc: Record<string, string>, setting: SiteSetting) => {
        if (setting.key && setting.value) {
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {} as Record<string, string>);
      setSettings(settingsMap);
      
      // Apply dynamic CSS variables for theme
      if (settingsMap.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settingsMap.primary_color);
      }
    }
  }, [settingsData]);

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  const refresh = () => {
    refetch();
  };

  return (
    <SiteSettingsContext.Provider 
      value={{ 
        settings, 
        getSetting, 
        isLoading,
        refresh 
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}

// Default settings for fallback
export const DEFAULT_SETTINGS = {
  site_name: 'Manga Reader',
  site_description: 'Read your favorite manga online',
  header_logo: '',
  meta_title: 'Manga Reader - Read Manga Online',
  meta_description: 'Read your favorite manga online for free with high-quality images and fast updates.',
  og_image: '',
  primary_color: '#007bff',
  footer_text: '© 2024 Manga Reader. All rights reserved.',
  contact_email: '',
  twitter_url: '',
  discord_url: '',
};