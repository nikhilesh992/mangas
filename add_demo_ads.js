// Demo script to add test ads to the system
import { storage } from './server/storage.js';

async function addDemoAds() {
  try {
    console.log('🎯 Adding demo ads to the system...');
    
    // 1. Add a Network Ad (Google AdSense style)
    const networkAd = await storage.createAd({
      networkName: 'Google AdSense Demo',
      adScript: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1234567890123456"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
      slots: ['homepage_top', 'manga_detail_top', 'reader_top'],
      enabled: true
    });
    
    console.log('✅ Network ad created:', networkAd.id);
    
    // 2. Add a Banner Ad  
    const bannerAd = await storage.createAd({
      networkName: 'Manga Promo Banner',
      bannerImage: '/stock-manga.jpg',
      bannerLink: 'https://example.com/manga-collection',
      slots: ['homepage_bottom', 'manga_detail_inline', 'blog_post_inline'],
      enabled: true
    });
    
    console.log('✅ Banner ad created:', bannerAd.id);
    
    // 3. Add an Adsterra-style network ad
    const adsterraAd = await storage.createAd({
      networkName: 'Adsterra Demo',
      adScript: `<script type="text/javascript">
    atOptions = {
        'key' : 'demo1234567890abcdef',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
    };
    document.write('<scr' + 'ipt type="text/javascript" src="http' + (location.protocol === 'https:' ? 's' : '') + '://www.profitabledisplaynetwork.com/demo1234567890abcdef/invoke.js"></scr' + 'ipt>');
</script>`,
      slots: ['reader_bottom', 'blog_top'],
      enabled: true
    });
    
    console.log('✅ Adsterra ad created:', adsterraAd.id);
    
    // List all ads to verify
    const allAds = await storage.getAds();
    console.log('📊 Total ads in system:', allAds.length);
    
    allAds.forEach(ad => {
      console.log(`- ${ad.networkName} (ID: ${ad.id}) - Slots: ${ad.slots?.join(', ')}`);
    });
    
    console.log('🎉 Demo ads setup complete!');
    
  } catch (error) {
    console.error('❌ Error adding demo ads:', error);
  }
}

// Run the demo ads setup
addDemoAds();