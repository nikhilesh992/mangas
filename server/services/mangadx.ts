interface MangaDxManga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Array<Record<string, string>>;
    description: Record<string, string>;
    isLocked: boolean;
    links: Record<string, string>;
    originalLanguage: string;
    lastVolume: string;
    lastChapter: string;
    publicationDemographic: string;
    status: string;
    year: number;
    contentRating: string;
    tags: Array<{
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
        description: Record<string, string>;
        group: string;
        version: number;
      };
    }>;
    state: string;
    chapterNumbersResetOnNewVolume: boolean;
    createdAt: string;
    updatedAt: string;
    version: number;
    availableTranslatedLanguages: string[];
    latestUploadedChapter: string;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: any;
  }>;
}

interface MangaDxChapter {
  id: string;
  type: string;
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: string;
    externalUrl: string;
    publishAt: string;
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
    version: number;
  };
  relationships: Array<{
    id: string;
    type: string;
  }>;
}

interface MangaDxAtHome {
  result: string;
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

interface MangaDxResponse<T> {
  result: string;
  response: string;
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

class MangaDxService {
  private baseUrl: string;

  constructor(baseUrl = "https://api.mangadex.org") {
    this.baseUrl = baseUrl;
  }

  async getMangaList(params: {
    limit?: number;
    offset?: number;
    order?: string;
    includes?: string[];
    hasAvailableChapters?: boolean;
    contentRating?: string[];
    status?: string[];
    tags?: string[];
    excludedTags?: string[];
  } = {}): Promise<MangaDxResponse<MangaDxManga[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.order) searchParams.set('order[updatedAt]', params.order);
    if (params.includes) {
      params.includes.forEach(include => searchParams.append('includes[]', include));
    }
    if (params.hasAvailableChapters !== undefined) {
      searchParams.set('hasAvailableChapters', params.hasAvailableChapters.toString());
    }
    if (params.contentRating) {
      params.contentRating.forEach(rating => searchParams.append('contentRating[]', rating));
    }
    if (params.status) {
      params.status.forEach(status => searchParams.append('status[]', status));
    }
    if (params.tags) {
      params.tags.forEach(tag => searchParams.append('includedTags[]', tag));
    }
    if (params.excludedTags) {
      params.excludedTags.forEach(tag => searchParams.append('excludedTags[]', tag));
    }

    const response = await fetch(`${this.baseUrl}/manga?${searchParams}`);
    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getMangaById(id: string, includes: string[] = ['cover_art', 'author', 'artist']): Promise<MangaDxResponse<MangaDxManga>> {
    const searchParams = new URLSearchParams();
    includes.forEach(include => searchParams.append('includes[]', include));

    const response = await fetch(`${this.baseUrl}/manga/${id}?${searchParams}`);
    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async searchManga(title: string, params: {
    limit?: number;
    offset?: number;
    includes?: string[];
  } = {}): Promise<MangaDxResponse<MangaDxManga[]>> {
    const searchParams = new URLSearchParams();
    searchParams.set('title', title);
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.includes) {
      params.includes.forEach(include => searchParams.append('includes[]', include));
    }

    const response = await fetch(`${this.baseUrl}/manga?${searchParams}`);
    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getChaptersByMangaId(mangaId: string, params: {
    limit?: number;
    offset?: number;
    translatedLanguage?: string[];
    order?: string;
  } = {}): Promise<MangaDxResponse<MangaDxChapter[]>> {
    const searchParams = new URLSearchParams();
    searchParams.set('manga', mangaId); // Use 'manga' instead of 'manga[]' for single ID
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.translatedLanguage) {
      params.translatedLanguage.forEach(lang => searchParams.append('translatedLanguage[]', lang));
    }
    
    // Set proper chapter ordering
    searchParams.set('order[volume]', 'asc');
    searchParams.set('order[chapter]', 'asc');

    const response = await fetch(`${this.baseUrl}/chapter?${searchParams}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText} - ${errorText.slice(0, 200)}`);
    }
    return await response.json();
  }

  async getChapterById(id: string): Promise<MangaDxResponse<MangaDxChapter>> {
    const response = await fetch(`${this.baseUrl}/chapter/${id}`);
    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getChapterImages(chapterId: string): Promise<MangaDxAtHome> {
    const response = await fetch(`${this.baseUrl}/at-home/server/${chapterId}`);
    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getCoverArt(coverId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/cover/${coverId}`);
    if (!response.ok) {
      throw new Error(`MangaDx API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  buildImageUrl(baseUrl: string, hash: string, filename: string, quality: 'data' | 'data-saver' = 'data'): string {
    return `${baseUrl}/${quality}/${hash}/${filename}`;
  }

  buildCoverUrl(mangaId: string, filename: string, size: number = 512): string {
    return `https://uploads.mangadex.org/covers/${mangaId}/${filename}.${size}.jpg`;
  }

  extractTitle(manga: MangaDxManga, language = 'en'): string {
    return manga.attributes.title[language] || 
           manga.attributes.title['ja-ro'] || 
           manga.attributes.title['ja'] || 
           Object.values(manga.attributes.title)[0] || 
           'Unknown Title';
  }

  extractDescription(manga: MangaDxManga, language = 'en'): string {
    return manga.attributes.description[language] || 
           manga.attributes.description['ja-ro'] || 
           manga.attributes.description['ja'] || 
           Object.values(manga.attributes.description)[0] || 
           'No description available';
  }

  extractGenres(manga: MangaDxManga): string[] {
    return manga.attributes.tags
      .filter(tag => tag.attributes.group === 'genre')
      .map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0]);
  }

  extractAuthors(manga: MangaDxManga): Array<{ id: string; name: string; type: string }> {
    return manga.relationships
      .filter(rel => rel.type === 'author' || rel.type === 'artist')
      .map(rel => ({
        id: rel.id,
        name: rel.attributes?.name || 'Unknown',
        type: rel.type
      }));
  }

  extractCoverArt(manga: MangaDxManga): string | null {
    const coverRel = manga.relationships.find(rel => rel.type === 'cover_art');
    if (coverRel?.attributes?.fileName) {
      return this.buildCoverUrl(manga.id, coverRel.attributes.fileName);
    }
    return null;
  }
}

export const mangaDxService = new MangaDxService();
export type { MangaDxManga, MangaDxChapter, MangaDxAtHome, MangaDxResponse };
