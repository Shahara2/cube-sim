export type ViewMode = 'front' | 'back' | 'left' | 'right' | 'top' | 'iso';
export type AppMode = 'setup' | 'work';

export interface CellCoord {
  row: number;
  col: number;
}

export interface AppState {
  grid: number[][];
  rows: number;
  cols: number;
  mode: AppMode;
  viewMode: ViewMode;
  selectedCell: CellCoord | null;
  maxStackHeight: number;
}

export type Action =
  | { type: 'SET_HEIGHT'; row: number; col: number; value: number }
  | { type: 'ADJUST_HEIGHT'; row: number; col: number; delta: number }
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'SET_VIEW'; viewMode: ViewMode }
  | { type: 'SELECT_CELL'; cell: CellCoord | null }
  | { type: 'SET_GRID_ROWS'; rows: number }
  | { type: 'SET_GRID_COLS'; cols: number }
  | { type: 'SET_MAX_HEIGHT'; value: number }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export interface HistoryState {
  past: AppState[];
  present: AppState;
  future: AppState[];
}
