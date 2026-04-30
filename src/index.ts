import './styles.css';
import { Game } from './core/Game';
import { Renderer } from './ui/Renderer';
import { storageManager } from './utils/StorageManager';
import { themeManager } from './utils/ThemeManager';
import { LEVELS } from './constants';

class GameApp {
  private game: Game;
  private renderer: Renderer;

  constructor() {
    const savedTheme = storageManager.getTheme();
    themeManager.setTheme(savedTheme);
    themeManager.applyTheme();

    this.game = new Game(1);
    this.renderer = new Renderer(this.game);

    this.setupGameListeners();
  }

  private setupGameListeners(): void {
    this.game.on((type, data) => {
      switch (type) {
        case 'state_change':
          this.renderer.render();
          break;
        case 'level_complete':
          this.handleLevelComplete(data as {
            score: number;
            moves: number;
            minerals: { gold: number; silver: number; copper: number };
          });
          break;
        case 'level_failed':
          this.handleLevelFailed(data as {
            score: number;
            moves: number;
            minerals: { gold: number; silver: number; copper: number };
          });
          break;
        case 'combo':
          this.handleCombo(data as { combo: number; score: number });
          break;
      }
    });

    const board = this.game.getBoard();
    board.on((type, data) => {
      switch (type) {
        case 'combo':
          const comboData = data as { combo: number; score: number };
          if (comboData.combo > 1) {
            this.renderer.showCombo(comboData.combo);
          }
          break;
        case 'mineral':
          this.renderer.render();
          break;
      }
    });

    themeManager.onThemeChange(() => {
      this.renderer.render();
    });
  }

  private handleLevelComplete(data: {
    score: number;
    moves: number;
    minerals: { gold: number; silver: number; copper: number };
  }): void {
    const currentLevel = this.game.getState().currentLevel;
    const stars = this.game.getStars();
    
    storageManager.updateLevelScore(currentLevel, data.score);
    storageManager.updateHighScore(data.score);
    
    if (currentLevel < LEVELS.length) {
      storageManager.setLevelProgress(currentLevel + 1, { unlocked: true });
    }
    
    this.renderer.showResultModal(
      true,
      stars,
      data.score,
      data.moves
    );
  }

  private handleLevelFailed(data: {
    score: number;
    moves: number;
    minerals: { gold: number; silver: number; copper: number };
  }): void {
    this.renderer.showResultModal(
      false,
      0,
      data.score,
      data.moves
    );
  }

  private handleCombo(data: { combo: number; score: number }): void {
    if (data.combo > 1) {
      this.renderer.showCombo(data.combo);
    }
  }

  start(): void {
    this.renderer.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.start();
});
