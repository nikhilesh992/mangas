import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTracker } from "@/hooks/use-page-tracking";
import { SiteSettingsProvider } from "@/contexts/site-settings-context";

// Pages
import Home from "@/pages/home";
import MangaDetail from "@/pages/manga-detail";
import Reader from "@/pages/reader";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Favorites from "@/pages/favorites";
import ReadingHistory from "@/pages/reading-history";
import ApiInfo from "@/pages/api-info";
import NotFound from "@/pages/not-found";

// Admin Pages
import { AdminLayout } from "@/components/layout/admin-layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminApiConfig from "@/pages/admin/api-config";
import AdminAds from "@/pages/admin/ads";
import AdminBlog from "@/pages/admin/blog-admin";
import AdminUsers from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";
import AdminSiteSettings from "@/pages/admin/site-settings";
import AdminLogin from "@/pages/admin/login";

// Auth Pages
import AuthLogin from "@/pages/auth/login";
import AuthRegister from "@/pages/auth/register";

function MainRouter() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageTracker />
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/manga/:id" component={MangaDetail} />
          <Route path="/reader/:id" component={Reader} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:id" component={BlogPost} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/reading-history" component={ReadingHistory} />
          <Route path="/api-info" component={ApiInfo} />
          
          {/* Auth Routes */}
          <Route path="/auth/login" component={AuthLogin} />
          <Route path="/auth/register" component={AuthRegister} />
          
          {/* Admin Routes */}
          <Route path="/admin" component={() => (
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          )} />
          <Route path="/admin/analytics" component={() => (
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          )} />
          <Route path="/admin/api-config" component={() => (
            <AdminLayout>
              <AdminApiConfig />
            </AdminLayout>
          )} />
          <Route path="/admin/ads" component={() => (
            <AdminLayout>
              <AdminAds />
            </AdminLayout>
          )} />
          <Route path="/admin/blog" component={() => (
            <AdminLayout>
              <AdminBlog />
            </AdminLayout>
          )} />
          <Route path="/admin/users" component={() => (
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          )} />
          <Route path="/admin/settings" component={() => (
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          )} />
          <Route path="/admin/site-settings" component={() => (
            <AdminLayout>
              <AdminSiteSettings />
            </AdminLayout>
          )} />
          <Route path="/admin/login" component={AdminLogin} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <MainRouter />
          </TooltipProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
