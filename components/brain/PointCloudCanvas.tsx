'use client'

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GeneratedPointCloudBrain } from './GeneratedPointCloudBrain';
import type { BrainRegionScores } from '@/types/patient';
import { scoreToColor } from './colorUtils';

interface PointCloudCanvasProps {
  regionScores: BrainRegionScores;
  pointDensity?: number;
}

// Helper to format camelCase to readable text
function formatRegionName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function PointCloudCanvas({ regionScores, pointDensity = 5000 }: PointCloudCanvasProps) {
  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-black via-slate-950 to-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-800">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <PerspectiveCamera makeDefault position={[2.5, 1.5, 2.5]} fov={45} />

        {/* Dark ambient lighting for particle effect */}
        <ambientLight intensity={0.2} />

        {/* Colored lights for atmosphere */}
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#4488ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff4488" />
        <pointLight position={[0, 10, 0]} intensity={0.4} color="#44ff88" />

        {/* The point cloud brain */}
        <GeneratedPointCloudBrain
          regionScores={regionScores}
          pointDensity={pointDensity}
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a0f', 6, 18]} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          enableZoom={false}
          minDistance={1.5}
          maxDistance={12}
        />
      </Canvas>

      {/* Region Scores Panel - Compact */}
      <div className="absolute top-3 right-3 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 p-2.5 shadow-xl max-w-[200px]">
        <h3 className="text-xs font-bold mb-2 text-white border-b border-slate-700 pb-1.5">
          Brain Regions
        </h3>
        <div className="space-y-1.5">
          {Object.entries(regionScores).map(([key, score]) => {
            const color = scoreToColor(score);
            const rgbColor = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;

            return (
              <div key={key} className="flex items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0 border border-slate-600"
                    style={{ backgroundColor: rgbColor }}
                  />
                  <span className="text-slate-300 truncate leading-tight">
                    {formatRegionName(key)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-mono font-semibold text-white text-[10px]">
                    {(score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700 text-[9px] text-slate-500 leading-tight">
          Hover particles for details
        </div>
      </div>
    </div>
  );
}