'use client'

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { GeneratedPointCloudBrain } from './GeneratedPointCloudBrain';
import type { BrainRegionScores } from '@/types/patient';
import { scoreToColor, scoreToLabel } from './colorUtils';
import * as THREE from 'three';

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
        <PerspectiveCamera makeDefault position={[4, 2, 4]} fov={50} />
        
        {/* Dark ambient lighting for particle effect */}
        <ambientLight intensity={0.2} />
        
        {/* Colored lights for atmosphere */}
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#4488ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff4488" />
        <pointLight position={[0, 10, 0]} intensity={0.4} color="#44ff88" />
        
        {/* Dark environment for contrast */}
        <Environment preset="night" />
        
        {/* The point cloud brain */}
        <GeneratedPointCloudBrain 
          regionScores={regionScores} 
          pointDensity={pointDensity}
        />
        
        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a0f', 8, 20]} />
        
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
          Hover over particles for region details
        </div>
      </div>
    </div>
  );
}