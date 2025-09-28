import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-[#111] text-white py-6 shadow-[0_-2px_10px_rgba(0,0,0,0.3)] border-t border-gray-800" data-testid="main-footer">
      <div className="container mx-auto px-4 text-center">
        {/* Copyright */}
        <p className="text-sm mb-4" data-testid="footer-copyright">
          © 2025 MangaSite. All rights reserved.
        </p>
        
        {/* Social Icons */}
        <div className="flex justify-center items-center space-x-6" data-testid="footer-social">
          <a 
            href="#" 
            className="text-white hover:text-blue-500 transition-colors duration-200" 
            aria-label="Facebook"
            data-testid="social-facebook"
          >
            <FaFacebook size={24} />
          </a>
          <a 
            href="#" 
            className="text-white hover:text-blue-400 transition-colors duration-200" 
            aria-label="Twitter"
            data-testid="social-twitter"
          >
            <FaTwitter size={24} />
          </a>
          <a 
            href="#" 
            className="text-white hover:text-pink-500 transition-colors duration-200" 
            aria-label="Instagram"
            data-testid="social-instagram"
          >
            <FaInstagram size={24} />
          </a>
          <a 
            href="#" 
            className="text-white hover:text-green-500 transition-colors duration-200" 
            aria-label="WhatsApp"
            data-testid="social-whatsapp"
          >
            <FaWhatsapp size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
}
