import { ThemeType, ThemeConfig } from '../types';
import { THEMES } from '../constants';
import { storageManager } from '../utils/StorageManager';

export class ThemeManager {
  private currentTheme: ThemeType;
  private listeners: ((theme: ThemeType) => void)[] = [];

  constructor() {
    this.currentTheme = storageManager.getTheme();
  }

  getTheme(): ThemeType {
    return this.currentTheme;
  }

  getThemeConfig(): ThemeConfig {
    return THEMES[this.currentTheme];
  }

  setTheme(theme: ThemeType): void {
    if (this.currentTheme === theme) return;
    
    this.currentTheme = theme;
    storageManager.setTheme(theme);
    this.applyTheme();
    this.notifyListeners();
  }

  applyTheme(): void {
    const config = this.getThemeConfig();
    
    document.documentElement.style.setProperty('--bg-color', config.backgroundColor);
    document.documentElement.style.setProperty('--board-bg-color', config.boardBackgroundColor);
    document.documentElement.style.setProperty('--text-color', config.textColor);
    
    document.documentElement.style.setProperty('--gem-red', config.gemColors.red);
    document.documentElement.style.setProperty('--gem-blue', config.gemColors.blue);
    document.documentElement.style.setProperty('--gem-green', config.gemColors.green);
    document.documentElement.style.setProperty('--gem-yellow', config.gemColors.yellow);
    document.documentElement.style.setProperty('--gem-purple', config.gemColors.purple);
    
    document.documentElement.style.setProperty('--dirt-color', config.dirtColor);
    document.documentElement.style.setProperty('--rock-color', config.rockColor);
    
    document.documentElement.style.setProperty('--mineral-gold', config.mineralColors.gold);
    document.documentElement.style.setProperty('--mineral-silver', config.mineralColors.silver);
    document.documentElement.style.setProperty('--mineral-copper', config.mineralColors.copper);
    
    document.body.className = `theme-${this.currentTheme}`;
  }

  onThemeChange(listener: (theme: ThemeType) => void): void {
    this.listeners.push(listener);
  }

  offThemeChange(listener: (theme: ThemeType) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  cycleTheme(): void {
    const themes: ThemeType[] = ['mine', 'desert', 'dungeon'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}

export const themeManager = new ThemeManager();
