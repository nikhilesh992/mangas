import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Plug, 
  Accessibility, 
  FileText, 
  Users, 
  Settings, 
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-access-denied">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: BarChart3, testId: "admin-nav-dashboard" },
    { name: "API Config", href: "/admin/api-config", icon: Plug, testId: "admin-nav-api" },
    { name: "Accessibility Management", href: "/admin/ads", icon: Accessibility, testId: "admin-nav-ads" },
    { name: "Blog Posts", href: "/admin/blog", icon: FileText, testId: "admin-nav-blog" },
    { name: "User Management", href: "/admin/users", icon: Users, testId: "admin-nav-users" },
    { name: "Settings", href: "/admin/settings", icon: Settings, testId: "admin-nav-settings" },
  ];

  const Sidebar = () => (
    <div className="w-64 bg-card border-r border-border admin-sidebar flex-shrink-0" data-testid="admin-sidebar">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-6" data-testid="admin-panel-title">
          Admin Panel
        </h2>
        <nav className="space-y-2" data-testid="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href} data-testid={item.testId}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="admin-layout">
      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar />}

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-50 flex" data-testid="mobile-sidebar-overlay">
            <div className="fixed inset-0 bg-background/80" onClick={() => setSidebarOpen(false)} />
            <div className="relative">
              <Sidebar />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSidebarOpen(false)}
                data-testid="close-mobile-sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto" data-testid="admin-main-content">
          {/* Mobile Header */}
          {isMobile && (
            <div className="bg-card border-b border-border p-4 flex items-center justify-between" data-testid="admin-mobile-header">
              <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                data-testid="open-mobile-sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
