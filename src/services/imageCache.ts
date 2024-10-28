class ImageCache {
  private cache: Map<string, string> = new Map();
  private preloadQueue: string[] = [];
  private isPreloading: boolean = false;
  private maxCacheSize: number = 100;

  async preload(url: string): Promise<void> {
    if (this.cache.has(url)) return;

    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = url;
      img.onload = () => {
        this.cache.set(url, url);
        this.maintainCacheSize();
        resolve();
      };
      img.onerror = reject;
    });
  }

  async preloadBatch(urls: string[]): Promise<void> {
    this.preloadQueue.push(...urls);
    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  private async processPreloadQueue() {
    this.isPreloading = true;
    while (this.preloadQueue.length > 0) {
      const batchSize = 3; // Load 3 images at a time
      const batch = this.preloadQueue.splice(0, batchSize);
      await Promise.allSettled(batch.map(url => this.preload(url)));
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.isPreloading = false;
  }

  get(url: string): string | undefined {
    return this.cache.get(url);
  }

  private maintainCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = Array.from(this.cache.keys())[0];
      this.cache.delete(firstKey);
    }
  }
}

export const imageCache = new ImageCache();
