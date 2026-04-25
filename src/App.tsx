import React, { useEffect, useState, useCallback } from 'react';
import { CubeProvider, useCube, actions } from './store/CubeContext';
import { ThreeRenderer } from './components/canvas/ThreeRenderer';
import { GridEditor } from './components/controls/GridEditor';
import { Toolbar } from './components/ui/Toolbar';
import { ViewSelector, StatsPanel } from './components/ui/ViewAndStats';
import { useEmbedAPI } from './hooks/useEmbedAPI';
import styles from './App.module.css';

function CubeApp() {
  const { state, dispatch, canUndo, canRedo } = useCube();
  const [showDiagram, setShowDiagram] = useState(false);
  const [showLabels,  setShowLabels]  = useState(true);

  // Embed API — active when running inside an iframe
  const { isEmbedded } = useEmbedAPI({ state, dispatch });

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); dispatch(actions.undo());
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); dispatch(actions.redo());
      }
      if (e.key === 'ArrowUp'   && state.selectedCell) { e.preventDefault(); dispatch(actions.adjustHeight(state.selectedCell.row, state.selectedCell.col,  1)); }
      if (e.key === 'ArrowDown' && state.selectedCell) { e.preventDefault(); dispatch(actions.adjustHeight(state.selectedCell.row, state.selectedCell.col, -1)); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.selectedCell]);

  const handleCellClick = useCallback(
    (cell: { row: number; col: number }) => dispatch(actions.selectCell(cell)),
    [dispatch]
  );

  return (
    <div className={`${styles.app} ${isEmbedded ? styles.embedded : ''}`} dir="rtl">
      {/* Hide toolbar when embedded — host controls the mode */}
      {!isEmbedded && <Toolbar />}

      <div className={styles.layout}>
        <div className={styles.viewportCol}>
          <div className={styles.viewportCard}>
            <div className={styles.viewportOverlay}>
              <ViewSelector compact />
              <div className={styles.viewToggles}>
                <button
                  className={`${styles.toggleBtn} ${showLabels ? styles.toggleOn : ''}`}
                  onClick={() => setShowLabels(v => !v)}
                >תוויות</button>
                <button
                  className={`${styles.toggleBtn} ${showDiagram ? styles.toggleOn : ''}`}
                  onClick={() => setShowDiagram(v => !v)}
                >תרשים</button>
              </div>
            </div>
            <div className={styles.canvasWrap}>
              <ThreeRenderer
                state={state}
                onCellClick={handleCellClick}
                showLabels={showLabels}
              />
            </div>
            <div className={styles.viewHint}>
              גרור לסיבוב · גלגלת לזום · Shift+גרור להזזה
            </div>
          </div>

          {showDiagram && (
            <div className={styles.diagramCard}>
              <GridEditor />
            </div>
          )}
        </div>

        <div className={styles.sideCol}>
          {!showDiagram && (
            <div className={styles.card}>
              <GridEditor />
            </div>
          )}
          <div className={styles.card}>
            <p className={styles.cardLabel}>סטטיסטיקה</p>
            <StatsPanel />
          </div>
        </div>
      </div>

      {!isEmbedded && (
        <p className={styles.hint}>
          לחץ על קובייה לבחירה · ↑↓ לשינוי גובה · Ctrl+Z לביטול
        </p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CubeProvider>
      <CubeApp />
    </CubeProvider>
  );
}
