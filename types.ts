
export enum AppMode {
  HOME = 'HOME',
  PRACTICE = 'PRACTICE',
  GAME = 'GAME',
  RPGGAME = 'RPGGAME',
  RACEGAME = 'RACEGAME',
  STATS = 'STATS'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface KeyConfig {
  key: string;
  label?: string; // For things like Shift, Enter
  width?: number; // Relative width (1 is standard key)
  finger?: number; // 1-10 mapping to fingers (1=left pinky, 10=right pinky)
  hand?: 'left' | 'right';
  row: number;
}

export interface Lesson {
  id: string;
  title: string;
  category: 'basics' | 'finger' | 'words' | 'sentences' | 'code' | 'ai' | 'primary' | 'custom';
  content: string;
  difficulty: Difficulty;
}

export interface PracticeStats {
  wpm: number;
  accuracy: number;
  totalChars: number;
  errors: number;
  timeElapsed: number; // seconds
  errorKeys: Record<string, number>; // Map of key -> error count
}

export interface GameWord {
  id: string;
  text: string;
  x: number; // Percent 0-90
  y: number; // Percent 0-100
  speed: number;
}