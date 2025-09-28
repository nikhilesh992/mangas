import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Palette, Book, Zap, Shield } from "lucide-react";

export default function ApiInfo() {
  const { data: apiInfo, isLoading } = useQuery({
    queryKey: ["/api/info"],
    queryFn: async () => {
      const response = await fetch("/api/info");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!apiInfo) return null;

  const getApiIcon = (name: string) => {
    switch (name) {
      case "MangaDx":
        return <Book className="h-6 w-6 text-blue-500" />;
      case "MangaPlus":
        return <Palette className="h-6 w-6 text-orange-500" />;
      default:
        return <Globe className="h-6 w-6" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes("color") || feature.includes("Color")) {
      return <Palette className="h-4 w-4 text-orange-500" />;
    }
    if (feature.includes("language") || feature.includes("Multi")) {
      return <Globe className="h-4 w-4 text-blue-500" />;
    }
    if (feature.includes("official") || feature.includes("Official")) {
      return <Shield className="h-4 w-4 text-green-500" />;
    }
    if (feature.includes("quality") || feature.includes("optimized")) {
      return <Zap className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">API Information</h1>
        <p className="text-muted-foreground">
          Our manga platform integrates with multiple APIs to provide the best reading experience
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {apiInfo.apis.map((api: any, index: number) => (
          <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getApiIcon(api.name)}
                <div>
                  <h3 className="text-xl">{api.name}</h3>
                  <Badge variant="outline" className="mt-1">
                    {api.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{api.description}</p>
              
              <div>
                <h4 className="font-semibold mb-2">Content Type</h4>
                <Badge variant="secondary" className="text-sm">
                  {api.contentType}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <div className="space-y-2">
                  {api.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {getFeatureIcon(feature)}
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Supported Languages</h4>
                <div className="flex flex-wrap gap-1">
                  {api.languages.slice(0, 5).map((lang: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                  {api.languages.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{api.languages.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Base URL</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {api.baseUrl}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Usage Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Book className="h-4 w-4 text-blue-500" />
                MangaDx (Primary)
              </h4>
              <p className="text-sm text-muted-foreground">
                {apiInfo.usage.mangadx}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4 text-orange-500" />
                MangaPlus (Secondary)
              </h4>
              <p className="text-sm text-muted-foreground">
                {apiInfo.usage.mangaplus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
