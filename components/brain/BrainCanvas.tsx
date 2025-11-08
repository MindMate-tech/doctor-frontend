'use client'

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { BrainModel } from './BrainModel';
import type { BrainRegionScores } from '@/types/patient';
import { scoreToColor, scoreToLabel } from './colorUtils';

interface BrainCanvasProps {
  regionScores: BrainRegionScores;
}

// Helper to format camelCase to readable text
function formatRegionName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function BrainCanvas({ regionScores }: BrainCanvasProps) {
  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden shadow-2xl border border-slate-700">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[4, 2, 4]}
          fov={50}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        <directionalLight
          position={[-5, 5, -5]}
          intensity={0.3}
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#4488ff" />
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* The brain */}
        <BrainModel regionScores={regionScores} />
        
        {/* Optional grid for reference */}
        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#4b5563"
          fadeDistance={25}
          fadeStrength={1}
          position={[0, -2, 0]}
        />
        
        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          minDistance={2}
          maxDistance={15}
        />
      </Canvas>

      {/* Region Scores Panel */}
      <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 p-4 shadow-xl max-w-xs">
        <h3 className="text-sm font-bold mb-3 text-white border-b border-slate-700 pb-2">
          Brain Region Scores
        </h3>
        <div className="space-y-2">
          {Object.entries(regionScores).map(([key, score]) => {
            const color = scoreToColor(score);
            const rgbColor = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;

            return (
              <div key={key} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-600"
                    style={{ backgroundColor: rgbColor }}
                  />
                  <span className="text-slate-300 truncate">
                    {formatRegionName(key)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono font-semibold text-white">
                    {(score * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {scoreToLabel(score)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 text-[10px] text-slate-500">
          Hover over brain regions for details
        </div>
      </div>
    </div>
  );
}