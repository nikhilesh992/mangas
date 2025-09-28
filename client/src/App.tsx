import { Switch, Route } from "wouter";
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
import Browse from "@/pages/browse";
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
import AdminApiConfig from "@/pages/admin/api-config";
import AdminAds from "@/pages/admin/ads";
import AdminBlog from "@/pages/admin/blog-admin";
import AdminUsers from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";

import NotFound from "@/pages/not-found";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/api-config" component={AdminApiConfig} />
        <Route path="/admin/ads" component={AdminAds} />
        <Route path="/admin/blog" component={AdminBlog} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function MainRouter() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse" component={Browse} />
          <Route path="/manga/:id" component={MangaDetail} />
          <Route path="/reader/:chapterId" component={Reader} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/reading-history" component={ReadingHistory} />
          <Route path="/admin/:rest*" component={AdminRouter} />
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
