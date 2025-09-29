import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { useSiteSettings } from "@/contexts/site-settings-context";

export function Footer() {
  const { getSetting } = useSiteSettings();

  const footerText = getSetting('footer_text', '© 2025 MangaSite. All rights reserved.');
  const facebookUrl = getSetting('facebook_url', '');
  const twitterUrl = getSetting('twitter_url', '');
  const instagramUrl = getSetting('instagram_url', '');
  const whatsappUrl = getSetting('whatsapp_url', '');
  const customMessage = getSetting('footer_custom_message', '');

  // Only show social icons that have URLs configured
  const socialLinks = [
    { icon: FaFacebook, url: facebookUrl, label: "Facebook", color: "hover:text-blue-500", testId: "social-facebook" },
    { icon: FaTwitter, url: twitterUrl, label: "Twitter", color: "hover:text-blue-400", testId: "social-twitter" },
    { icon: FaInstagram, url: instagramUrl, label: "Instagram", color: "hover:text-pink-500", testId: "social-instagram" },
    { icon: FaWhatsapp, url: whatsappUrl, label: "WhatsApp", color: "hover:text-green-500", testId: "social-whatsapp" }
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="bg-[#111] text-white py-8 mt-12 sm:mt-16 shadow-[0_-2px_10px_rgba(0,0,0,0.3)] border-t border-gray-800" data-testid="main-footer">
      <div className="container mx-auto px-4 text-center">
        {/* Custom Message */}
        {customMessage && (
          <p className="text-sm mb-3 text-muted-foreground" data-testid="footer-custom-message">
            {customMessage}
          </p>
        )}

        {/* Copyright */}
        <p className="text-sm mb-4" data-testid="footer-copyright">
          {footerText}
        </p>
        
        {/* Social Icons */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center items-center space-x-6" data-testid="footer-social">
            {socialLinks.map(({ icon: Icon, url, label, color, testId }) => (
              <a 
                key={label}
                href={url} 
                className={`text-white ${color} transition-colors duration-200`}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={testId}
              >
                <Icon size={24} />
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
