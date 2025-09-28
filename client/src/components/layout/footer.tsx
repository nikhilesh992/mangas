import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card shadow-lg mt-16" data-testid="main-footer">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div data-testid="footer-brand">
            <h3 className="font-bold text-foreground mb-4">MangaVerse</h3>
            <p className="text-sm text-muted-foreground">
              Your ultimate destination for reading manga online.
            </p>
          </div>
          
          <div data-testid="footer-quick-links">
            <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link href="/" className="block hover:text-primary transition-colors" data-testid="footer-browse">
                Browse Manga
              </Link>
              <Link href="/?order=latest" className="block hover:text-primary transition-colors" data-testid="footer-latest">
                Latest Updates
              </Link>
              <Link href="/?order=popular" className="block hover:text-primary transition-colors" data-testid="footer-popular">
                Popular Series
              </Link>
              <Link href="/?random=true" className="block hover:text-primary transition-colors" data-testid="footer-random">
                Random Manga
              </Link>
            </div>
          </div>
          
          <div data-testid="footer-community">
            <h4 className="font-semibold text-foreground mb-3">Community</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link href="/blog" className="block hover:text-primary transition-colors" data-testid="footer-blog">
                Blog
              </Link>
              <a href="#" className="block hover:text-primary transition-colors" data-testid="footer-forums">
                Forums
              </a>
              <a href="#" className="block hover:text-primary transition-colors" data-testid="footer-discord">
                Discord
              </a>
              <a href="#" className="block hover:text-primary transition-colors" data-testid="footer-support">
                Support
              </a>
            </div>
          </div>
          
          <div data-testid="footer-legal">
            <h4 className="font-semibold text-foreground mb-3">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="block hover:text-primary transition-colors" data-testid="footer-privacy">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block hover:text-primary transition-colors" data-testid="footer-terms">
                Terms of Service
              </Link>
              <Link href="/dmca" className="block hover:text-primary transition-colors" data-testid="footer-dmca">
                DMCA
              </Link>
              <Link href="/contact" className="block hover:text-primary transition-colors" data-testid="footer-contact">
                Contact
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 text-center text-sm text-muted-foreground" data-testid="footer-copyright">
          <p>&copy; 2024 MangaVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
