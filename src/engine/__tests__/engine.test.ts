import { describe, it, expect } from 'vitest';
import { cubeReducer, makeEmptyGrid, makeInitialState } from '../../store/cubeReducer';
import { computeStats, computeSilhouette, isoProject } from '../../engine';

describe('cubeReducer', () => {
  it('SET_HEIGHT clamps to [0, maxStackHeight]', () => {
    const s = makeInitialState();
    expect(cubeReducer(s, { type: 'SET_HEIGHT', row: 0, col: 0, value: 99 }).grid[0][0]).toBe(s.maxStackHeight);
    expect(cubeReducer(s, { type: 'SET_HEIGHT', row: 0, col: 0, value: -5 }).grid[0][0]).toBe(0);
  });

  it('ADJUST_HEIGHT increments and decrements', () => {
    let s = makeInitialState();
    s = cubeReducer(s, { type: 'SET_HEIGHT', row: 1, col: 2, value: 3 });
    s = cubeReducer(s, { type: 'ADJUST_HEIGHT', row: 1, col: 2, delta: 2 });
    expect(s.grid[1][2]).toBe(5);
    s = cubeReducer(s, { type: 'ADJUST_HEIGHT', row: 1, col: 2, delta: -10 });
    expect(s.grid[1][2]).toBe(0);
  });

  it('SET_GRID_ROWS preserves existing values', () => {
    let s = makeInitialState(3, 3);
    s = cubeReducer(s, { type: 'SET_HEIGHT', row: 0, col: 0, value: 4 });
    s = cubeReducer(s, { type: 'SET_GRID_ROWS', rows: 5 });
    expect(s.rows).toBe(5);
    expect(s.grid[0][0]).toBe(4);
    expect(s.grid[4][0]).toBe(0);
  });

  it('SET_GRID_COLS clamps to [2,8]', () => {
    const s = makeInitialState();
    expect(cubeReducer(s, { type: 'SET_GRID_COLS', cols: 1 }).cols).toBe(2);
    expect(cubeReducer(s, { type: 'SET_GRID_COLS', cols: 99 }).cols).toBe(8);
  });

  it('RESET zeroes the grid', () => {
    let s = makeInitialState();
    s = cubeReducer(s, { type: 'SET_HEIGHT', row: 2, col: 3, value: 7 });
    s = cubeReducer(s, { type: 'RESET' });
    expect(s.grid.flat().every((v: number) => v === 0)).toBe(true);
  });

  it('SET_MAX_HEIGHT clamps existing values', () => {
    let s = makeInitialState();
    s = cubeReducer(s, { type: 'SET_HEIGHT', row: 0, col: 0, value: 8 });
    s = cubeReducer(s, { type: 'SET_MAX_HEIGHT', value: 3 });
    expect(s.grid[0][0]).toBe(3);
  });

  it('is immutable', () => {
    const s = makeInitialState();
    const original = JSON.stringify(s.grid);
    cubeReducer(s, { type: 'SET_HEIGHT', row: 0, col: 0, value: 5 });
    expect(JSON.stringify(s.grid)).toBe(original);
  });
});

describe('computeStats', () => {
  it('counts correctly', () => {
    const s = computeStats([[1, 2], [3, 0]]);
    expect(s.total).toBe(6);
    expect(s.maxHeight).toBe(3);
    expect(s.filledCells).toBe(3);
    expect(s.totalCells).toBe(4);
  });
  it('front silhouette is per-column max', () => {
    expect(computeStats([[1, 5], [3, 2]]).frontSilhouette).toEqual([3, 5]);
  });
  it('left silhouette is per-row max', () => {
    expect(computeStats([[1, 5], [3, 2]]).leftSilhouette).toEqual([5, 3]);
  });
  it('all-zero returns zeros', () => {
    const s = computeStats(makeEmptyGrid(4, 4));
    expect(s.total).toBe(0);
  });
});

describe('computeSilhouette', () => {
  const grid = [[1,2,0],[4,1,3],[0,2,5]];
  it('front: max per column', () => {
    expect(computeSilhouette(grid, 'front').map((s: { height: number }) => s.height)).toEqual([4,2,5]);
  });
  it('left: max per row', () => {
    expect(computeSilhouette(grid, 'left').map((s: { height: number }) => s.height)).toEqual([2,4,5]);
  });
  it('back: reversed columns', () => {
    expect(computeSilhouette(grid, 'back').map((s: { height: number }) => s.height)).toEqual([5,2,4]);
  });
  it('right: reversed rows', () => {
    expect(computeSilhouette(grid, 'right').map((s: { height: number }) => s.height)).toEqual([5,4,2]);
  });
});

describe('isoProject', () => {
  it('origin → (ox, oy) at z=0', () => {
    const pt = isoProject(0, 0, 0, 30, 200, 150);
    expect(pt.x).toBeCloseTo(200); expect(pt.y).toBeCloseTo(150);
  });
  it('z increase moves point up', () => {
    expect(isoProject(0,0,1,30,200,150).y).toBeLessThan(isoProject(0,0,0,30,200,150).y);
  });
});
