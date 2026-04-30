import { Game } from '../core/Game';
import { Cell, Position, ItemType, ThemeType } from '../types';
import { GRID_SIZE, LEVELS } from '../constants';
import { storageManager } from '../utils/StorageManager';
import { themeManager } from '../utils/ThemeManager';

export class Renderer {
  private game: Game;
  private boardElement: HTMLElement;
  private activeItem: ItemType | null = null;

  constructor(game: Game) {
    this.game = game;
    this.boardElement = document.getElementById('game-board')!;
    this.setupEventListeners();
    this.render();
  }

  private setupEventListeners(): void {
    this.boardElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const cellElement = target.closest('.cell') as HTMLElement;
      
      if (cellElement) {
        const row = parseInt(cellElement.dataset.row!);
        const col = parseInt(cellElement.dataset.col!);
        
        if (this.activeItem) {
          this.useItemOnCell(this.activeItem, row, col);
          this.activeItem = null;
          this.updateItemButtons();
        } else {
          this.game.selectCell(row, col);
        }
      }
    });

    const levelBtn = document.getElementById('menu-btn');
    if (levelBtn) {
      levelBtn.addEventListener('click', () => this.showLevelSelect());
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.hideLevelSelect());
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.game.resetLevel();
        this.render();
      });
    }

    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.showThemeModal());
    }

    const closeThemeBtn = document.getElementById('close-theme-btn');
    if (closeThemeBtn) {
      closeThemeBtn.addEventListener('click', () => this.hideThemeModal());
    }

    document.querySelectorAll('.item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemType = (btn as HTMLElement).dataset.item as ItemType;
        
        if (this.game.isItemDisabled(itemType)) {
          this.showItemTooltip(itemType, '本关无法使用此道具');
          return;
        }
        
        const state = this.game.getState();
        if (state.items[itemType] <= 0) {
          this.showItemTooltip(itemType, '道具次数已用完');
          return;
        }
        
        if (itemType === 'refresh') {
          this.game.useItem('refresh');
          this.render();
        } else {
          if (this.activeItem === itemType) {
            this.activeItem = null;
            this.showItemTooltip(itemType, '已取消选择');
          } else {
            this.activeItem = itemType;
            this.showItemTooltip(itemType, '请点击棋盘上的位置');
          }
          this.updateItemButtons();
        }
      });
      
      btn.addEventListener('mouseenter', () => {
        const itemType = (btn as HTMLElement).dataset.item as ItemType;
        this.showItemHint(itemType);
      });
      
      btn.addEventListener('mouseleave', () => {
        this.hideItemHint();
      });
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = (btn as HTMLElement).dataset.theme as ThemeType;
        themeManager.setTheme(theme);
        this.updateThemeButtons();
      });
    });

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hideResultModal();
        this.game.resetLevel();
        this.render();
      });
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.hideResultModal();
        const currentLevel = this.game.getState().currentLevel;
        if (currentLevel < LEVELS.length) {
          this.game.loadLevel(currentLevel + 1);
          this.render();
        }
      });
    }

    const menuResultBtn = document.getElementById('menu-result-btn');
    if (menuResultBtn) {
      menuResultBtn.addEventListener('click', () => {
        this.hideResultModal();
        this.showLevelSelect();
      });
    }
  }

  private useItemOnCell(itemType: ItemType, row: number, col: number): void {
    const cell = this.game.getBoard().getCell(row, col);
    if (!cell) return;

    if (itemType === 'bomb') {
      const result = this.game.useItem('bomb', row, col);
      if (result.success && result.affectedPositions) {
        this.animateExplosion(result.affectedPositions);
        setTimeout(() => this.render(), 300);
      }
    } else if (itemType === 'pickaxe') {
      if (cell.type === 'rock') {
        const result = this.game.useItem('pickaxe', row, col);
        if (result.success && result.affectedPositions) {
          this.animateExplosion(result.affectedPositions);
          setTimeout(() => this.render(), 300);
        }
      }
    }
  }

  private animateExplosion(positions: Position[]): void {
    for (const pos of positions) {
      const cellElement = this.boardElement.querySelector(
        `[data-row="${pos.row}"][data-col="${pos.col}"]`
      ) as HTMLElement;
      if (cellElement) {
        cellElement.classList.add('exploding');
      }
    }
  }

  private updateItemButtons(): void {
    const state = this.game.getState();
    
    document.querySelectorAll('.item-btn').forEach(btn => {
      const itemType = (btn as HTMLElement).dataset.item as ItemType;
      const countSpan = btn.querySelector('.item-count') as HTMLElement;
      
      const isDisabled = this.game.isItemDisabled(itemType);
      const hasNoCount = state.items[itemType] <= 0;
      
      if (countSpan) {
        countSpan.textContent = state.items[itemType].toString();
      }
      
      (btn as HTMLButtonElement).disabled = isDisabled || hasNoCount;
      
      btn.classList.remove('disabled-type', 'no-count');
      
      if (isDisabled) {
        btn.classList.add('disabled-type');
        btn.title = '本关无法使用此道具';
      } else if (hasNoCount) {
        btn.classList.add('no-count');
        btn.title = '道具次数已用完';
      } else {
        btn.title = this.getItemDescription(itemType);
      }
      
      if (this.activeItem === itemType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private getItemDescription(itemType: ItemType): string {
    const descriptions: Record<ItemType, string> = {
      refresh: '刷新棋盘 - 随机重新排列所有宝石',
      bomb: '炸弹 - 消除 3×3 范围内的所有元素',
      pickaxe: '鹤嘴锄 - 直接消除一个岩石障碍'
    };
    return descriptions[itemType];
  }

  private showItemTooltip(itemType: ItemType, message: string): void {
    const btn = document.querySelector(`[data-item="${itemType}"]`) as HTMLElement;
    if (!btn) return;
    
    let tooltip = btn.querySelector('.item-tooltip') as HTMLElement;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'item-tooltip';
      btn.style.position = 'relative';
      btn.appendChild(tooltip);
    }
    
    tooltip.textContent = message;
    tooltip.style.display = 'block';
    
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.style.display = 'none';
      }
    }, 2000);
  }

  private showItemHint(itemType: ItemType): void {
    const isDisabled = this.game.isItemDisabled(itemType);
    const state = this.game.getState();
    
    if (isDisabled) {
      this.showItemTooltip(itemType, '本关无法使用此道具');
    } else if (state.items[itemType] <= 0) {
      this.showItemTooltip(itemType, '道具次数已用完');
    } else {
      this.showItemTooltip(itemType, this.getItemDescription(itemType));
    }
  }

  private hideItemHint(): void {
    document.querySelectorAll('.item-tooltip').forEach(tooltip => {
      (tooltip as HTMLElement).style.display = 'none';
    });
  }

  private updateThemeButtons(): void {
    const currentTheme = themeManager.getTheme();
    document.querySelectorAll('.theme-option').forEach(btn => {
      const theme = (btn as HTMLElement).dataset.theme;
      if (theme === currentTheme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  render(): void {
    this.renderBoard();
    this.renderGameInfo();
    this.renderMinerals();
    this.updateItemButtons();
    this.updateThemeButtons();
    this.renderLevelGrid();
  }

  private renderBoard(): void {
    this.boardElement.innerHTML = '';
    const state = this.game.getState();
    const grid = this.game.getBoard().getGrid();

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = grid.getCell(row, col);
        const cellElement = this.createCellElement(cell!, row, col);
        
        if (state.selectedCell && 
            state.selectedCell.row === row && 
            state.selectedCell.col === col) {
          cellElement.classList.add('selected');
        }
        
        this.boardElement.appendChild(cellElement);
      }
    }
  }

  private createCellElement(cell: Cell, row: number, col: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'cell';
    element.dataset.row = row.toString();
    element.dataset.col = col.toString();
    
    element.classList.add(cell.type);
    
    if (cell.gemColor) {
      element.classList.add(cell.gemColor);
    }
    
    if (cell.mineralType && cell.type === 'mineral') {
      element.classList.add(cell.mineralType);
      if (!cell.isHidden) {
        element.classList.add('revealed');
      }
    }
    
    if (cell.isFalling) {
      element.classList.add('falling');
    }
    
    if (cell.isMatched) {
      element.classList.add('matched');
    }
    
    return element;
  }

  private renderGameInfo(): void {
    const state = this.game.getState();
    
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) levelDisplay.textContent = state.currentLevel.toString();
    
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) scoreDisplay.textContent = state.score.toString();
    
    const targetScore = document.getElementById('target-score');
    if (targetScore) targetScore.textContent = state.targetScore.toString();
    
    const movesDisplay = document.getElementById('moves-display');
    if (movesDisplay) {
      const remainingMoves = state.maxMoves - state.moves;
      movesDisplay.textContent = remainingMoves.toString();
      
      if (remainingMoves <= 5) {
        movesDisplay.classList.add('low');
      } else {
        movesDisplay.classList.remove('low');
      }
    }
  }

  private renderMinerals(): void {
    const state = this.game.getState();
    const collected = state.collectedMinerals;
    const goal = state.mineralGoal;
    
    const types: ('gold' | 'silver' | 'copper')[] = ['gold', 'silver', 'copper'];
    
    for (const type of types) {
      const countElement = document.getElementById(`${type}-count`);
      const goalElement = document.getElementById(`${type}-goal`);
      const mineralCountElement = document.querySelector(`.mineral-item.${type} .mineral-count`);
      
      if (countElement) countElement.textContent = collected[type].toString();
      if (goalElement) goalElement.textContent = goal[type].toString();
      
      if (mineralCountElement) {
        if (collected[type] >= goal[type]) {
          mineralCountElement.classList.add('completed');
        } else {
          mineralCountElement.classList.remove('completed');
        }
      }
    }
  }

  private renderLevelGrid(): void {
    const levelGrid = document.getElementById('level-grid');
    if (!levelGrid) return;
    
    levelGrid.innerHTML = '';
    const allProgress = storageManager.getAllProgress();
    
    for (let level = 1; level <= LEVELS.length; level++) {
      const progress = allProgress[level];
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      
      if (progress && progress.unlocked) {
        btn.classList.add('unlocked');
        if (progress.completed) {
          btn.classList.add('completed');
        }
        
        btn.addEventListener('click', () => {
          this.hideLevelSelect();
          this.game.loadLevel(level);
          this.render();
        });
      } else {
        btn.classList.add('locked');
        btn.innerHTML = '🔒';
      }
      
      const levelNum = document.createElement('span');
      levelNum.textContent = level.toString();
      btn.appendChild(levelNum);
      
      if (progress && progress.completed) {
        const starsDiv = document.createElement('div');
        starsDiv.className = 'level-stars';
        
        for (let i = 0; i < 3; i++) {
          const star = document.createElement('span');
          star.className = 'star';
          if (i < progress.stars) {
            star.classList.add('filled');
          }
          star.textContent = '⭐';
          starsDiv.appendChild(star);
        }
        
        btn.appendChild(starsDiv);
      }
      
      levelGrid.appendChild(btn);
    }
  }

  showLevelSelect(): void {
    const menuScreen = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    
    if (menuScreen) menuScreen.classList.add('active');
    if (gameScreen) gameScreen.style.display = 'none';
  }

  hideLevelSelect(): void {
    const menuScreen = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    
    if (menuScreen) menuScreen.classList.remove('active');
    if (gameScreen) gameScreen.style.display = 'flex';
  }

  showThemeModal(): void {
    const modal = document.getElementById('theme-modal');
    if (modal) modal.classList.remove('hidden');
  }

  hideThemeModal(): void {
    const modal = document.getElementById('theme-modal');
    if (modal) modal.classList.add('hidden');
  }

  showResultModal(isWin: boolean, stars: number, score: number, moves: number): void {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const starsDiv = document.getElementById('result-stars');
    const scoreSpan = document.getElementById('result-score');
    const movesSpan = document.getElementById('result-moves');
    const nextBtn = document.getElementById('next-btn');
    
    if (!modal || !title || !starsDiv || !scoreSpan || !movesSpan) return;
    
    title.textContent = isWin ? '恭喜通关！' : '游戏结束';
    title.className = 'result-title';
    title.classList.add(isWin ? 'win' : 'lose');
    
    if (isWin && stars > 0) {
      starsDiv.style.display = 'flex';
      starsDiv.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        if (i < stars) {
          star.classList.add('filled');
        }
        star.textContent = '⭐';
        star.style.animationDelay = `${i * 0.2}s`;
        starsDiv.appendChild(star);
      }
      
      const currentLevel = this.game.getState().currentLevel;
      if (currentLevel < LEVELS.length && nextBtn) {
        nextBtn.classList.remove('hidden');
      }
    } else {
      starsDiv.style.display = 'none';
      if (nextBtn) nextBtn.classList.add('hidden');
    }
    
    scoreSpan.textContent = score.toString();
    movesSpan.textContent = moves.toString();
    
    modal.classList.remove('hidden');
  }

  hideResultModal(): void {
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.add('hidden');
  }

  showCombo(combo: number): void {
    const comboDisplay = document.getElementById('combo-display');
    if (!comboDisplay) return;
    
    comboDisplay.textContent = `${combo} 连击！`;
    comboDisplay.classList.remove('hidden');
    
    setTimeout(() => {
      comboDisplay.classList.add('hidden');
    }, 1000);
  }
}
