import { API_BASE_URL } from '../config/constants';

export interface WelcomePageBackground {
  id: number;
  background_image: string;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

export interface WelcomeCard {
  id: number;
  title: string;
  description: string;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

export interface CarouselImage {
  id: number;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

export interface WelcomePageData {
  background: WelcomePageBackground;
  cards: WelcomeCard[];
}

export interface CarouselData {
  images: CarouselImage[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class WelcomePageService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL || 'http://localhost:5000';
  }

  /**
   * Get welcome page data (background and cards)
   */
  async getWelcomePageData(): Promise<WelcomePageData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/welcome-page/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<WelcomePageData> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch welcome page data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching welcome page data:', error);
      throw error;
    }
  }

  /**
   * Get login carousel images
   */
  async getCarouselImages(): Promise<CarouselImage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/welcome-page/carousel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CarouselData> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch carousel images');
      }

      return result.data.images;
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      throw error;
    }
  }

  /**
   * Get full image URL
   */
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * Preload an image
   */
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Preload multiple images
   */
  async preloadImages(imagePaths: string[]): Promise<void> {
    try {
      const imageUrls = imagePaths.map(path => this.getImageUrl(path));
      await Promise.all(imageUrls.map(url => this.preloadImage(url)));
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  // Archive methods
  async getArchivedCards(page: number = 1, limit: number = 20): Promise<ApiResponse<{ data: WelcomeCard[]; pagination: any }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/welcome-page/admin/archive/cards?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching archived cards:', {
        error,
        url: `${this.baseUrl}/api/welcome-page/admin/archive/cards?page=${page}&limit=${limit}`,
        page,
        limit
      });
      throw error;
    }
  }

  async getArchivedCarouselImages(page: number = 1, limit: number = 20): Promise<ApiResponse<{ data: CarouselImage[]; pagination: any }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/welcome-page/admin/archive/carousel?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching archived carousel images:', {
        error,
        url: `${this.baseUrl}/api/welcome-page/admin/archive/carousel?page=${page}&limit=${limit}`,
        page,
        limit
      });
      throw error;
    }
  }

  // Restore archived welcome card
  async restoreCard(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/welcome-page/admin/cards/${id}/restore`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error restoring card:', {
        error,
        url: `${this.baseUrl}/api/welcome-page/admin/cards/${id}/restore`,
        cardId: id
      });
      throw error;
    }
  }

  // Restore archived carousel image
  async restoreCarouselImage(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/welcome-page/admin/carousel/${id}/restore`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error restoring carousel image:', {
        error,
        url: `${this.baseUrl}/api/welcome-page/admin/carousel/${id}/restore`,
        imageId: id
      });
      throw error;
    }
  }
}

export const welcomePageService = new WelcomePageService();
export default welcomePageService;
