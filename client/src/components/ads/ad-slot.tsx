import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { adsApi } from "@/lib/api";
import type { Ad } from "@/lib/types";
import { analytics } from "@/lib/analytics";

interface AdSlotProps {
  position: string;
  className?: string;
}

// Default ad sizes for different slots (in pixels)
const DEFAULT_AD_SIZES: Record<string, { width: number; height: number }> = {
  homepage_top: { width: 728, height: 90 }, // Leaderboard
  homepage_bottom: { width: 728, height: 90 }, // Leaderboard
  browse_top: { width: 728, height: 90 }, // Leaderboard
  manga_detail_top: { width: 300, height: 250 }, // Medium Rectangle
  manga_detail_inline: { width: 336, height: 280 }, // Large Rectangle
  reader_top: { width: 728, height: 90 }, // Leaderboard
  reader_bottom: { width: 728, height: 90 }, // Leaderboard
  blog_top: { width: 728, height: 90 }, // Leaderboard
  blog_post_top: { width: 728, height: 90 }, // Leaderboard
  blog_post_inline: { width: 300, height: 250 }, // Medium Rectangle
};

// Helper function to get effective dimensions for an ad
function getAdDimensions(ad: Ad, position: string): { width: number; height: number } {
  const defaultSize = DEFAULT_AD_SIZES[position] || { width: 300, height: 250 };
  
  return {
    width: (ad.width && ad.width > 0) ? ad.width : defaultSize.width,
    height: (ad.height && ad.height > 0) ? ad.height : defaultSize.height,
  };
}

export function AdSlot({ position, className = "" }: AdSlotProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);

  // Make ads API calls optional and handle errors gracefully
  const { data: adNetworks, error: adNetworksError } = useQuery({
    queryKey: ["/api/ads/networks"],
    queryFn: async () => {
      try {
        return await adsApi.getAdNetworks();
      } catch (error) {
        console.warn('Failed to load ad networks:', error);
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as { data: Ad[] | undefined; error: any; };

  const { data: banners, error: bannersError } = useQuery({
    queryKey: ["/api/ads/banners", position],
    queryFn: async () => {
      try {
        return await adsApi.getBanners(position);
      } catch (error) {
        console.warn('Failed to load banners:', error);
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as { data: Ad[] | undefined; error: any; };

  // Inject ad network scripts
  useEffect(() => {
    if (!adNetworks || !adContainerRef.current) return;

    const activeNetworks = adNetworks.filter(
      network => network.enabled && network.slots.includes(position)
    );

    activeNetworks.forEach(network => {
      if (network.adScript) {
        try {
          // Create a temporary container to parse the script
          const temp = document.createElement('div');
          temp.innerHTML = network.adScript;
          
          // Find script tags and execute them
          const scripts = temp.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            
            if (script.src) {
              newScript.src = script.src;
              newScript.async = true;
            } else {
              newScript.textContent = script.textContent;
            }
            
            // Copy attributes
            Array.from(script.attributes).forEach(attr => {
              newScript.setAttribute(attr.name, attr.value);
            });
            
            // Append to container
            if (adContainerRef.current) {
              adContainerRef.current.appendChild(newScript);
            }
          });

          // Find non-script elements and append them
          const nonScripts = temp.querySelectorAll(':not(script)');
          nonScripts.forEach(element => {
            if (adContainerRef.current) {
              adContainerRef.current.appendChild(element.cloneNode(true));
            }
          });
        } catch (error) {
          console.error('Error loading ad script:', error);
        }
      }
    });

    // Cleanup function
    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, [adNetworks, position]);

  const handleBannerClick = async (bannerId: string) => {
    try {
      await adsApi.trackBannerClick(bannerId);
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }
  };

  // Don't render if no ads available
  const hasAdNetworks = adNetworks?.some(
    network => network.enabled && network.slots.includes(position)
  );
  const hasBanners = banners && banners.length > 0;

  if (!hasAdNetworks && !hasBanners) {
    return null;
  }

  return (
    <div 
      className={`ad-slot ${className}`} 
      data-position={position}
      data-testid={`ad-slot-${position}`}
    >
      {/* Custom Banners */}
      {banners && banners.length > 0 && (
        <div className="custom-banners space-y-4" data-testid={`banners-${position}`}>
          {banners.map((banner) => {
            const dimensions = getAdDimensions(banner, position);
            return (
              <div
                key={banner.id}
                className="custom-banner cursor-pointer"
                onClick={() => {
                  if (banner.bannerLink) {
                    handleBannerClick(banner.id.toString());
                    // Track ad click for analytics
                    analytics.trackAdClick(banner.id, position, window.location.pathname);
                    window.open(banner.bannerLink, '_blank', 'noopener,noreferrer');
                  }
                }}
                data-testid={`banner-${banner.id}`}
                style={{ width: dimensions.width, maxWidth: '100%' }}
              >
                <img
                  src={banner.bannerImage}
                  alt={banner.networkName || 'Advertisement'}
                  className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  loading="lazy"
                  style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    maxWidth: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Error loading banner image:', banner.bannerImage);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Ad Network Scripts Container */}
      {hasAdNetworks && (
        <div 
          ref={adContainerRef}
          className="ad-network-container"
          data-testid={`ad-network-${position}`}
          style={{
            width: adNetworks?.find(network => network.enabled && network.slots.includes(position))
              ? (() => {
                  const networkAd = adNetworks.find(network => network.enabled && network.slots.includes(position));
                  const dimensions = networkAd ? getAdDimensions(networkAd, position) : DEFAULT_AD_SIZES[position] || { width: 300, height: 250 };
                  return dimensions.width;
                })()
              : 'auto',
            minHeight: adNetworks?.find(network => network.enabled && network.slots.includes(position))
              ? (() => {
                  const networkAd = adNetworks.find(network => network.enabled && network.slots.includes(position));
                  const dimensions = networkAd ? getAdDimensions(networkAd, position) : DEFAULT_AD_SIZES[position] || { width: 300, height: 250 };
                  return dimensions.height;
                })()
              : 'auto',
            maxWidth: '100%'
          }}
        />
      )}
    </div>
  );
}
