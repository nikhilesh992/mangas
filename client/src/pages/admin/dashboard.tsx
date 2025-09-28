import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, Eye, DollarSign, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: adminApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-8" data-testid="admin-dashboard-loading">
        <div>
          <div className="bg-muted rounded h-8 w-48 animate-pulse mb-2" />
          <div className="bg-muted rounded h-4 w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="bg-muted rounded h-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Views",
      value: stats?.totalViews?.toLocaleString() || "0",
      description: "+12% from last month",
      icon: Eye,
      color: "text-primary",
      testId: "stat-total-views"
    },
    {
      title: "Active Users",
      value: stats?.activeUsers?.toLocaleString() || "0",
      description: "+8% from last month",
      icon: Users,
      color: "text-accent",
      testId: "stat-active-users"
    },
    {
      title: "Ad Revenue",
      value: `$${stats?.adRevenue?.toLocaleString() || "0"}`,
      description: "+15% from last month",
      icon: DollarSign,
      color: "text-green-400",
      testId: "stat-ad-revenue"
    },
    {
      title: "Blog Posts",
      value: stats?.blogPosts?.toString() || "0",
      description: "+5 this month",
      icon: FileText,
      color: "text-purple-400",
      testId: "stat-blog-posts"
    },
    {
      title: "Total Manga",
      value: stats?.totalManga?.toLocaleString() || "0",
      description: "Available series",
      icon: BarChart3,
      color: "text-blue-400",
      testId: "stat-total-manga"
    },
    {
      title: "Total Chapters",
      value: stats?.totalChapters?.toLocaleString() || "0",
      description: "Available chapters",
      icon: TrendingUp,
      color: "text-orange-400",
      testId: "stat-total-chapters"
    },
  ];

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground" data-testid="dashboard-description">
          Overview of your manga site performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="stats-grid">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={stat.testId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card data-testid="recent-activity-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1 text-sm">
                  <p className="text-foreground">New blog post published</p>
                  <p className="text-muted-foreground text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <div className="flex-1 text-sm">
                  <p className="text-foreground">API configuration updated</p>
                  <p className="text-muted-foreground text-xs">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <div className="flex-1 text-sm">
                  <p className="text-foreground">New ad banner added</p>
                  <p className="text-muted-foreground text-xs">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="system-status-card">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">API Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-muted-foreground">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-muted-foreground">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">CDN</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">MangaDx API</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-muted-foreground">Connected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
