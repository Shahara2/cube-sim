import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { AppState, ViewMode, CellCoord } from '../../types';

// ── Camera presets ────────────────────────────────────────────────
interface Preset { pos: THREE.Vector3; target: THREE.Vector3 }

function getPreset(viewMode: ViewMode, rows: number, cols: number, maxH: number): Preset {
  const cx = (cols - 1) / 2;
  const cy = maxH / 2;
  const cz = (rows - 1) / 2;
  const D  = Math.max(rows, cols) * 3.8;
  const t  = new THREE.Vector3(cx, cy * 0.5, cz);
  switch (viewMode) {
    case 'front': return { pos: new THREE.Vector3(cx, cy, cz + D), target: t };
    case 'back':  return { pos: new THREE.Vector3(cx, cy, cz - D), target: t };
    case 'left':  return { pos: new THREE.Vector3(cx - D, cy, cz), target: t };
    case 'right': return { pos: new THREE.Vector3(cx + D, cy, cz), target: t };
    case 'top':   return { pos: new THREE.Vector3(cx, cy + D, cz + 0.001), target: t };
    default:      return {
      pos: new THREE.Vector3(cx + cols * 1.7, cy + Math.max(rows, cols) * 1.3, cz + rows * 1.7),
      target: t,
    };
  }
}

// ── Camera rig: animates to preset, then hands off to OrbitControls ──
interface RigProps {
  preset: Preset;
  controlsRef: React.MutableRefObject<any>;
}

function CameraRig({ preset, controlsRef }: RigProps) {
  const { camera } = useThree();
  const animating = useRef(false);
  const destPos   = useRef(preset.pos.clone());
  const destTgt   = useRef(preset.target.clone());

  useEffect(() => {
    destPos.current.copy(preset.pos);
    destTgt.current.copy(preset.target);
    animating.current = true;
  }, [preset]);

  useFrame(() => {
    if (!animating.current) return;
    const ctrl = controlsRef.current;
    const alpha = 0.1;
    camera.position.lerp(destPos.current, alpha);
    if (ctrl) {
      ctrl.target.lerp(destTgt.current, alpha);
      ctrl.update();
    } else {
      camera.lookAt(destTgt.current);
    }
    // stop animating when close enough
    if (camera.position.distanceTo(destPos.current) < 0.01) {
      camera.position.copy(destPos.current);
      if (ctrl) { ctrl.target.copy(destTgt.current); ctrl.update(); }
      animating.current = false;
    }
  });

  return null;
}

// ── Cube colors ───────────────────────────────────────────────────
const C = {
  top:      new THREE.Color('#85B7EB'),
  side:     new THREE.Color('#378ADD'),
  selTop:   new THREE.Color('#97C459'),
  selSide:  new THREE.Color('#639922'),
  hovTop:   new THREE.Color('#B5D4F4'),
  hovSide:  new THREE.Color('#85B7EB'),
};

function makeGeo(top: THREE.Color, side: THREE.Color) {
  const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const buf: number[] = [];
  // +X -X +Y(top) -Y +Z -Z — 4 verts each
  [side, side, top, side, side, side].forEach(fc => {
    for (let v = 0; v < 4; v++) buf.push(fc.r, fc.g, fc.b);
  });
  geo.setAttribute('color', new THREE.Float32BufferAttribute(buf, 3));
  return geo;
}

const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 0.9, 0.9));

interface CubeProps {
  col: number; row: number; z: number;
  isSelected: boolean;
  onClick: () => void;
}

function Cube({ col, row, z, isSelected, onClick }: CubeProps) {
  const [hov, setHov] = useState(false);
  const top  = isSelected ? C.selTop  : hov ? C.hovTop  : C.top;
  const side = isSelected ? C.selSide : hov ? C.hovSide : C.side;
  const geo  = useMemo(() => makeGeo(top, side), [isSelected, hov]);

  useEffect(() => {
    document.body.style.cursor = hov ? 'pointer' : 'default';
    return () => { document.body.style.cursor = 'default'; };
  }, [hov]);

  return (
    <group position={[col, z, row]}>
      <mesh
        geometry={geo}
        onClick={e => { e.stopPropagation(); onClick(); }}
        onPointerOver={e => { e.stopPropagation(); setHov(true); }}
        onPointerOut={() => setHov(false)}
      >
        <meshLambertMaterial vertexColors />
      </mesh>
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color={isSelected ? '#27500A' : '#0a3060'} transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
}

// ── Floor grid ────────────────────────────────────────────────────
function FloorGrid({ rows, cols }: { rows: number; cols: number }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const y = -0.45;
    for (let i = 0; i <= rows; i++) {
      pts.push(-0.45, y, i - 0.45,  cols - 0.55, y, i - 0.45);
    }
    for (let i = 0; i <= cols; i++) {
      pts.push(i - 0.45, y, -0.45,  i - 0.45, y, rows - 0.55);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [rows, cols]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#888780" transparent opacity={0.3} />
    </lineSegments>
  );
}

// ── Sprite label ──────────────────────────────────────────────────
function Label({ text, position }: { text: string; position: [number, number, number] }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.font = 'bold 38px system-ui';
    ctx.fillStyle = 'rgba(90,88,80,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 34);
    return new THREE.CanvasTexture(c);
  }, [text]);

  return (
    <sprite position={position} scale={[0.7, 0.7, 0.7]}>
      <spriteMaterial map={tex} transparent depthWrite={false} sizeAttenuation />
    </sprite>
  );
}

function AxisLabels({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: cols }, (_, c) => (
        <Label key={`c${c}`} text={String(c + 1)} position={[c, -0.9, rows + 0.2]} />
      ))}
      {Array.from({ length: rows }, (_, r) => (
        <Label key={`r${r}`} text={String.fromCharCode(65 + r)} position={[-1.1, -0.9, r]} />
      ))}
    </>
  );
}

// ── Scene ─────────────────────────────────────────────────────────
function Scene({
  state, onCellClick, showLabels, controlsRef,
}: {
  state: AppState;
  onCellClick: (c: CellCoord) => void;
  showLabels: boolean;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { grid, rows, cols, selectedCell, viewMode } = state;
  const maxH   = Math.max(1, ...grid.flat());
  const preset = useMemo(() => getPreset(viewMode, rows, cols, maxH), [viewMode, rows, cols, maxH]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[cols * 2, Math.max(rows, cols) * 3, rows * 2]} intensity={0.7} />
      <directionalLight position={[-cols, Math.max(rows, cols) * 2, -rows * 0.5]} intensity={0.2} />

      <FloorGrid rows={rows} cols={cols} />
      {showLabels && <AxisLabels rows={rows} cols={cols} />}

      {grid.map((rowArr, r) =>
        rowArr.map((h, c) =>
          Array.from({ length: h }, (_, z) => (
            <Cube
              key={`${r}-${c}-${z}`}
              col={c} row={r} z={z}
              isSelected={selectedCell?.row === r && selectedCell?.col === c}
              onClick={() => onCellClick({ row: r, col: c })}
            />
          ))
        )
      )}

      <CameraRig preset={preset} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.65}
        panSpeed={0.8}
        zoomSpeed={1.1}
        minDistance={Math.max(rows, cols) * 0.7}
        maxDistance={Math.max(rows, cols) * 10}
        makeDefault
      />
    </>
  );
}

// ── Public component ──────────────────────────────────────────────
export interface ThreeRendererProps {
  state: AppState;
  onCellClick: (cell: CellCoord) => void;
  showLabels: boolean;
}

export function ThreeRenderer({ state, onCellClick, showLabels }: ThreeRendererProps) {
  const controlsRef = useRef<any>(null);

  return (
    <Canvas
      style={{ width: '100%', height: '100%', display: 'block' }}
      camera={{ position: [8, 7, 8], fov: 45, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => gl.setClearColor('#f0efe9', 1)}
    >
      <Scene
        state={state}
        onCellClick={onCellClick}
        showLabels={showLabels}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
}
