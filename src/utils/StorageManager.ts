import { LevelProgress, ThemeType, ItemType } from '../types';
import { STORAGE_KEYS, LEVELS } from '../constants';

interface SaveData {
  levelProgress: Record<number, LevelProgress>;
  highScore: number;
  currentTheme: ThemeType;
  items: Record<ItemType, number>;
}

const DEFAULT_PROGRESS: LevelProgress = {
  unlocked: false,
  completed: false,
  bestScore: 0,
  stars: 0
};

const DEFAULT_ITEMS: Record<ItemType, number> = {
  refresh: 3,
  bomb: 3,
  pickaxe: 3
};

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private getSaveData(): SaveData {
    const saved = localStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return this.createDefaultSaveData();
      }
    }
    return this.createDefaultSaveData();
  }

  private setSaveData(data: SaveData): void {
    localStorage.setItem(STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(data));
  }

  private createDefaultSaveData(): SaveData {
    const levelProgress: Record<number, LevelProgress> = {};
    
    for (let i = 1; i <= LEVELS.length; i++) {
      levelProgress[i] = {
        ...DEFAULT_PROGRESS,
        unlocked: i === 1
      };
    }

    return {
      levelProgress,
      highScore: 0,
      currentTheme: 'mine',
      items: { ...DEFAULT_ITEMS }
    };
  }

  getLevelProgress(level: number): LevelProgress {
    const data = this.getSaveData();
    return data.levelProgress[level] || { ...DEFAULT_PROGRESS };
  }

  setLevelProgress(level: number, progress: Partial<LevelProgress>): void {
    const data = this.getSaveData();
    const currentProgress = data.levelProgress[level] || { ...DEFAULT_PROGRESS };
    data.levelProgress[level] = {
      ...currentProgress,
      ...progress
    };

    if (progress.completed && level < LEVELS.length) {
      const nextLevel = level + 1;
      data.levelProgress[nextLevel] = {
        ...data.levelProgress[nextLevel],
        unlocked: true
      };
    }

    this.setSaveData(data);
  }

  updateLevelScore(level: number, score: number): { stars: number; isNewBest: boolean } {
    const currentProgress = this.getLevelProgress(level);
    const isNewBest = score > currentProgress.bestScore;

    const levelConfig = LEVELS[level - 1];
    if (!levelConfig) return { stars: 0, isNewBest: false };

    const scoreRatio = score / levelConfig.targetScore;
    let stars = 1;
    if (scoreRatio >= 2) stars = 3;
    else if (scoreRatio >= 1.5) stars = 2;

    if (isNewBest) {
      this.setLevelProgress(level, {
        bestScore: score,
        stars,
        completed: true
      });
    }

    return { stars, isNewBest };
  }

  getHighScore(): number {
    const data = this.getSaveData();
    return data.highScore;
  }

  updateHighScore(score: number): boolean {
    const data = this.getSaveData();
    if (score > data.highScore) {
      data.highScore = score;
      this.setSaveData(data);
      return true;
    }
    return false;
  }

  getTheme(): ThemeType {
    const data = this.getSaveData();
    return data.currentTheme;
  }

  setTheme(theme: ThemeType): void {
    const data = this.getSaveData();
    data.currentTheme = theme;
    this.setSaveData(data);
  }

  getItems(): Record<ItemType, number> {
    const data = this.getSaveData();
    return { ...data.items };
  }

  updateItems(items: Record<ItemType, number>): void {
    const data = this.getSaveData();
    data.items = { ...items };
    this.setSaveData(data);
  }

  useItem(itemType: ItemType): boolean {
    const data = this.getSaveData();
    if (data.items[itemType] > 0) {
      data.items[itemType]--;
      this.setSaveData(data);
      return true;
    }
    return false;
  }

  resetProgress(): void {
    const defaultData = this.createDefaultSaveData();
    this.setSaveData(defaultData);
  }

  getAllProgress(): Record<number, LevelProgress> {
    const data = this.getSaveData();
    return { ...data.levelProgress };
  }
}

export const storageManager = StorageManager.getInstance();
