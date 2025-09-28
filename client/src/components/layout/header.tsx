import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, User, LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isMobile = useIsMobile();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "pt-br", name: "Portuguese (BR)", flag: "🇧🇷" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Store in localStorage for persistence
    localStorage.setItem('selectedLanguage', languageCode);
    // Refresh current page to apply language filter
    window.location.reload();
  };

  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50" data-testid="main-header">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="logo-link">
              <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent" data-testid="site-logo">
                MangaVerse
              </h1>
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
            {!isMobile && (
              <form onSubmit={handleSearch} className="relative" data-testid="search-form">
                <Input
                  type="search"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </form>
            )}

            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} data-testid="mobile-search-button">
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="language-selector">
                  <Globe className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">
                    {languages.find(lang => lang.code === selectedLanguage)?.flag}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="language-menu">
                {languages.map((language) => (
                  <DropdownMenuItem 
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={selectedLanguage === language.code ? "bg-accent" : ""}
                    data-testid={`language-${language.code}`}
                  >
                    <span className="mr-2">{language.flag}</span>
                    {language.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
              
              <form onSubmit={handleSearch} className="pt-2" data-testid="mobile-search-form">
                <Input
                  type="search"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="mobile-search-input"
                />
              </form>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
