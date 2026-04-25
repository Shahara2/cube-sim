/**
 * embed.tsx — entry point when the app is loaded inside an iframe.
 *
 * Supports postMessage API so the host page can:
 *   - GET the current grid state
 *   - SET a grid state (e.g. teacher sets a challenge)
 *   - RESET the grid
 *   - LISTEN for changes (student progress)
 *
 * Host page example:
 *
 *   const frame = document.getElementById('cube-sim');
 *
 *   // Get current state
 *   frame.contentWindow.postMessage({ type: 'GET_STATE' }, '*');
 *
 *   // Set a challenge grid
 *   frame.contentWindow.postMessage({
 *     type: 'SET_STATE',
 *     grid: [[2,1,0],[3,2,1],[0,1,4]],
 *     rows: 3, cols: 3
 *   }, '*');
 *
 *   // Listen for student changes
 *   window.addEventListener('message', e => {
 *     if (e.data.type === 'STATE_CHANGED') {
 *       console.log('new grid:', e.data.grid);
 *     }
 *   });
 */

export type EmbedMessage =
  | { type: 'GET_STATE' }
  | { type: 'SET_STATE'; grid: number[][]; rows?: number; cols?: number; maxHeight?: number }
  | { type: 'RESET' }
  | { type: 'SET_VIEW'; viewMode: string }
  | { type: 'SET_MODE'; mode: 'setup' | 'work' };

export type EmbedResponse =
  | { type: 'STATE_CHANGED'; grid: number[][]; rows: number; cols: number; stats: { total: number; maxHeight: number } }
  | { type: 'STATE_RESPONSE'; grid: number[][]; rows: number; cols: number }
  | { type: 'READY' };
