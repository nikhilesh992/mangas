import { useEffect } from 'react';
import { useSiteSettings } from '@/contexts/site-settings-context';

interface DynamicHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function DynamicHead({ 
  title, 
  description, 
  image, 
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website' 
}: DynamicHeadProps) {
  const { getSetting } = useSiteSettings();

  useEffect(() => {
    // Get fallback values from site settings
    const siteTitle = getSetting('meta_title', 'Manga Reader - Read Manga Online');
    const siteDescription = getSetting('meta_description', 'Read your favorite manga online for free with high-quality images and fast updates.');
    const siteName = getSetting('site_name', 'Manga Reader');
    const ogImage = getSetting('og_image', '');

    // Use provided values or fall back to site settings
    const finalTitle = title || siteTitle;
    const finalDescription = description || siteDescription;
    const finalImage = image || ogImage;

    // Update document title
    document.title = finalTitle;

    // Function to update or create meta tag
    const updateMeta = (name: string, content: string, property?: string) => {
      if (!content) return;
      
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', finalDescription);
    updateMeta('author', siteName);

    // Open Graph meta tags
    updateMeta('', finalTitle, 'og:title');
    updateMeta('', finalDescription, 'og:description');
    updateMeta('', type, 'og:type');
    updateMeta('', url, 'og:url');
    updateMeta('', siteName, 'og:site_name');
    
    if (finalImage) {
      updateMeta('', finalImage, 'og:image');
      updateMeta('', finalImage, 'og:image:url');
      updateMeta('', '1200', 'og:image:width');
      updateMeta('', '630', 'og:image:height');
    }

    // Twitter Card meta tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDescription);
    
    if (finalImage) {
      updateMeta('twitter:image', finalImage);
    }

    // Additional SEO meta tags
    updateMeta('robots', 'index, follow');
    updateMeta('viewport', 'width=device-width, initial-scale=1.0');
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [title, description, image, url, type, getSetting]);

  return null; // This component doesn't render anything visible
}

// Hook for easy SEO management in pages
export function usePageSEO(seoData: DynamicHeadProps) {
  return <DynamicHead {...seoData} />;
}

// Pre-configured SEO components for common page types
export const HomeSEO = () => {
  const { getSetting } = useSiteSettings();
  return (
    <DynamicHead
      title={getSetting('meta_title', 'Manga Reader - Read Manga Online')}
      description={getSetting('meta_description', 'Read your favorite manga online for free with high-quality images and fast updates.')}
      type="website"
    />
  );
};

export const MangaSEO = ({ title, description, image }: { title: string; description?: string; image?: string }) => {
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'Manga Reader');
  
  return (
    <DynamicHead
      title={`${title} - ${siteName}`}
      description={description || `Read ${title} manga online for free at ${siteName}`}
      image={image}
      type="article"
    />
  );
};

export const BlogSEO = ({ title, description, image }: { title: string; description?: string; image?: string }) => {
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'Manga Reader');
  
  return (
    <DynamicHead
      title={`${title} - ${siteName} Blog`}
      description={description || `${title} - Latest updates and news from ${siteName}`}
      image={image}
      type="article"
    />
  );
};