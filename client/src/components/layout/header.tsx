import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSiteSettings } from "@/contexts/site-settings-context";

export function Header() {
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { getSetting } = useSiteSettings();
  
  // Show search on home pages
  const isHomePage = location === "/" || location === "/home";
  const [searchValue, setSearchValue] = useState("");



  const handleLogout = () => {
    logout();
    navigate("/");
  };


  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50" data-testid="main-header">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="logo-link">
              <div className="flex items-center space-x-2">
                {getSetting('header_logo') && (
                  <img 
                    src={getSetting('header_logo')} 
                    alt={getSetting('site_name', 'MangaVerse')}
                    className="h-8 w-auto"
                    data-testid="header-logo-image"
                  />
                )}
                <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent" data-testid="site-logo">
                  {getSetting('site_name', 'MangaVerse')}
                </h1>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-6" data-testid="main-navigation">
              <Link 
                href="/" 
                className={`transition-colors ${location === "/" || location.startsWith("/home") ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                data-testid="nav-home"
              >
                Home
              </Link>
              <Link 
                href="/blog" 
                className={`transition-colors ${location.startsWith("/blog") ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                data-testid="nav-blog"
              >
                Blog
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`transition-colors ${location.startsWith("/admin") ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  data-testid="nav-admin"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            {isHomePage && !isMobile && (
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search for manga titles..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-64 h-9 pl-9 bg-input border-border text-foreground"
                  data-testid="search-input"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="user-menu-button">
                    <User className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-testid="user-menu">
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" data-testid="menu-favorites">
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reading-history" data-testid="menu-reading-history">
                      Reading History
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" data-testid="menu-admin">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="default" size="sm" data-testid="login-button">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild variant="outline" size="sm" data-testid="register-button">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            )}

            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobile && isMenuOpen && (
          <div className="mt-4 py-4 border-t border-border" data-testid="mobile-menu">
            {/* Search Bar - Mobile */}
            {isHomePage && (
              <div className="relative mb-4">
                <Input
                  type="search"
                  placeholder="Search for manga titles..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full h-10 pl-9 bg-input border-border text-foreground"
                  data-testid="search-input-mobile"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
                data-testid="mobile-nav-home"
              >
                Home
              </Link>
              <Link 
                href="/blog" 
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
                data-testid="mobile-nav-blog"
              >
                Blog
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="mobile-nav-admin"
                >
                  Admin
                </Link>
              )}
              
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
