import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminLayout } from "@/components/layout/admin-layout";

// Pages
import Home from "@/pages/home";
import MangaDetail from "@/pages/manga-detail";
import Reader from "@/pages/reader";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Favorites from "@/pages/favorites";
import ReadingHistory from "@/pages/reading-history";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminApiConfig from "@/pages/admin/api-config";
import AdminAds from "@/pages/admin/ads";
import AdminBlog from "@/pages/admin/blog-admin";
import AdminUsers from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";

import NotFound from "@/pages/not-found";


function MainRouter() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/manga/:id" component={MangaDetail} />
          <Route path="/reader/:chapterId" component={Reader} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/reading-history" component={ReadingHistory} />
          <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/analytics" component={() => <AdminLayout><AdminAnalytics /></AdminLayout>} />
          <Route path="/admin/api-config" component={() => <AdminLayout><AdminApiConfig /></AdminLayout>} />
          <Route path="/admin/ads" component={() => <AdminLayout><AdminAds /></AdminLayout>} />
          <Route path="/admin/blog" component={() => <AdminLayout><AdminBlog /></AdminLayout>} />
          <Route path="/admin/users" component={() => <AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/settings" component={() => <AdminLayout><AdminSettings /></AdminLayout>} />
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
        <TooltipProvider>
          <Toaster />
          <MainRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
