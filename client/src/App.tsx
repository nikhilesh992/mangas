import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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

function MainRouter() {
  return (
    <div className="min-h-screen flex flex-col">
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
