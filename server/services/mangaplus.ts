interface MangaPlusChapter {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  startTimeStamp: number;
  endTimeStamp: number;
}

interface MangaPlusTitle {
  id: string;
  name: string;
  author: string;
  portraitImageUrl: string;
  landscapeImageUrl: string;
  viewCount: number;
  language: string;
  chapters: MangaPlusChapter[];
}

interface MangaPlusResponse {
  success?: {
    allTitlesView?: {
      titles: MangaPlusTitle[];
    };
    titleDetailView?: {
      title: MangaPlusTitle;
      titleImageUrl: string;
      overview: string;
      backgroundImageUrl: string;
      nextTimeStamp: number;
      updateTiming: string;
      viewingPeriodDescription: string;
      nonAppearanceInfo: string;
      firstChapterList: MangaPlusChapter[];
      lastChapterList: MangaPlusChapter[];
    };
    mangaViewer?: {
      pages: Array<{
        page?: {
          imageUrl: string;
          width: number;
          height: number;
          encryptionKey?: string;
        };
      }>;
    };
  };
  error?: {
    popups: Array<{
      subject: string;
      body: string;
    }>;
  };
}

export class MangaPlusService {
  private static readonly BASE_URL = 'https://jumpg-webapi.tokyo-cdn.com/api';
  
  static async getAllTitles(): Promise<MangaPlusTitle[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/title_list/all`);
      const data: MangaPlusResponse = await response.json();
      
      if (data.success?.allTitlesView) {
        return data.success.allTitlesView.titles;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching MangaPlus titles:', error);
      return [];
    }
  }

  static async getTitleDetail(titleId: string): Promise<MangaPlusTitle | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/title_detailV3?title_id=${titleId}`);
      const data: MangaPlusResponse = await response.json();
      
      if (data.success?.titleDetailView) {
        return {
          ...data.success.titleDetailView.title,
          chapters: [
            ...data.success.titleDetailView.firstChapterList,
            ...data.success.titleDetailView.lastChapterList
          ]
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching MangaPlus title detail:', error);
      return null;
    }
  }

  static async getChapterPages(chapterId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/manga_viewer?chapter_id=${chapterId}&split=yes&img_quality=super_high`);
      const data: MangaPlusResponse = await response.json();
      
      if (data.success?.mangaViewer) {
        return data.success.mangaViewer.pages
          .map(page => page.page?.imageUrl)
          .filter(Boolean) as string[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching MangaPlus chapter pages:', error);
      return [];
    }
  }

  // Convert MangaPlus format to our standard format
  static convertToStandardFormat(mangaPlusTitle: MangaPlusTitle): any {
    return {
      id: `mp-${mangaPlusTitle.id}`,
      title: mangaPlusTitle.name,
      description: `Author: ${mangaPlusTitle.author}. View Count: ${mangaPlusTitle.viewCount.toLocaleString()}`,
      coverUrl: mangaPlusTitle.portraitImageUrl,
      status: 'ongoing',
      year: new Date().getFullYear(),
      contentRating: 'safe',
      genres: ['Shonen', 'Action'], // MangaPlus doesn't provide genres, so we use defaults
      authors: [{ id: '1', name: mangaPlusTitle.author, type: 'author' }],
      updatedAt: new Date().toISOString(),
      latestChapter: mangaPlusTitle.chapters.length > 0 ? mangaPlusTitle.chapters[0].title : undefined,
      availableLanguages: [mangaPlusTitle.language || 'en'],
      source: 'mangaplus'
    };
  }

  static convertChapterToStandardFormat(chapter: MangaPlusChapter, titleId: string): any {
    return {
      id: `mp-${chapter.id}`,
      mangaId: `mp-${titleId}`,
      volume: '1',
      chapter: chapter.id,
      title: chapter.title || chapter.subtitle || `Chapter ${chapter.id}`,
      language: 'en',
      pages: 0, // Will be set when pages are loaded
      publishAt: new Date(chapter.startTimeStamp * 1000).toISOString(),
      readableAt: new Date(chapter.startTimeStamp * 1000).toISOString(),
      source: 'mangaplus'
    };
  }
}
