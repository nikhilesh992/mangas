import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, MousePointer, BookOpen, TrendingUp, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { analyticsApi } from "@/lib/api";
import type { AnalyticsFilters } from "@/lib/types";

export default function AdminAnalytics() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    limit: 20,
    offset: 0
  });

  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const { data: topManga, isLoading: topMangaLoading } = useQuery({
    queryKey: ["/api/analytics/top-manga", dateRange.from, dateRange.to],
    queryFn: () => analyticsApi.getTopManga(10, dateRange.from || undefined, dateRange.to || undefined),
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: analyticsApi.getDashboardStats,
  });

  const { data: mangaAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/manga", filters],
    queryFn: () => analyticsApi.getMangaAnalytics(filters),
  });

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  if (statsLoading) {
    return (
      <div className="space-y-8" data-testid="analytics-loading">
        <div>
          <div className="bg-muted rounded h-8 w-48 animate-pulse mb-2" />
          <div className="bg-muted rounded h-4 w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="bg-muted rounded h-4 w-24 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded h-8 w-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="analytics-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track manga views, impressions, and user engagement across your platform.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalViews?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardStats?.viewsGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalImpressions?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardStats?.impressionsGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reads</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalReads?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardStats?.readsGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Manga</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.activeManga || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Manga with views this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
          <CardDescription>
            Filter analytics data by date range and other criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateRangeChange('from', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateRangeChange('to', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="event-type">Event Type</Label>
              <Select onValueChange={(value) => handleFilterChange('eventType', value === 'all' ? undefined : [value])}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="view">Views</SelectItem>
                  <SelectItem value="impression">Impressions</SelectItem>
                  <SelectItem value="click">Clicks</SelectItem>
                  <SelectItem value="read">Reads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="page">Page</Label>
              <Select onValueChange={(value) => handleFilterChange('page', value === 'all' ? undefined : [value])}>
                <SelectTrigger>
                  <SelectValue placeholder="All Pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="detail">Detail</SelectItem>
                  <SelectItem value="reader">Reader</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setFilters({ limit: 20, offset: 0 });
                  setDateRange({ from: '', to: '' });
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Manga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Performing Manga
          </CardTitle>
          <CardDescription>
            Most viewed manga {dateRange.from || dateRange.to ? 'in selected date range' : 'of all time'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topMangaLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="bg-muted rounded h-12 w-12 animate-pulse" />
                  <div className="flex-1">
                    <div className="bg-muted rounded h-4 w-48 animate-pulse mb-2" />
                    <div className="bg-muted rounded h-3 w-24 animate-pulse" />
                  </div>
                  <div className="bg-muted rounded h-6 w-16 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topManga?.map((manga: any, index: number) => (
                <div key={manga.mangaId} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{manga.mangaTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {manga.uniqueViewers} unique viewers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {manga.totalViews.toLocaleString()} views
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {manga.totalImpressions.toLocaleString()} impressions
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-center text-muted-foreground py-8">
                  No analytics data available yet. Start browsing manga to generate analytics.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
