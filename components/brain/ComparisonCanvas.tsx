'use client'

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { BrainModel } from './BrainModel';
import { PointCloudBrainModel } from './PointCloudBrainModel';
import type { BrainRegionScores } from '@/types/patient';

interface ComparisonCanvasProps {
  regionScores: BrainRegionScores;
  leftModel: 'mesh' | 'pointcloud';
  rightModel: 'mesh' | 'pointcloud';
}

export function ComparisonCanvas({ regionScores, leftModel, rightModel }: ComparisonCanvasProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left Brain */}
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 bg-slate-900/90 px-3 py-1 rounded text-sm font-semibold border border-slate-700">
          {leftModel === 'mesh' ? 'Mesh Model' : 'Point Cloud Model'}
        </div>
        <div className="w-full h-[600px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden shadow-2xl border border-slate-700">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[4, 2, 4]} fov={50} />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#4488ff" />
            
            <Environment preset="city" />
            
            {leftModel === 'mesh' ? (
              <BrainModel regionScores={regionScores} />
            ) : (
              <PointCloudBrainModel regionScores={regionScores} />
            )}
            
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              minDistance={2}
              maxDistance={15}
            />
          </Canvas>
        </div>
      </div>
      
      {/* Right Brain */}
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 bg-slate-900/90 px-3 py-1 rounded text-sm font-semibold border border-slate-700">
          {rightModel === 'mesh' ? 'Mesh Model' : 'Point Cloud Model'}
        </div>
        <div className="w-full h-[600px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden shadow-2xl border border-slate-700">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[4, 2, 4]} fov={50} />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#4488ff" />
            
            <Environment preset="city" />
            
            {rightModel === 'mesh' ? (
              <BrainModel regionScores={regionScores} />
            ) : (
              <PointCloudBrainModel regionScores={regionScores} />
            )}
            
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              minDistance={2}
              maxDistance={15}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}