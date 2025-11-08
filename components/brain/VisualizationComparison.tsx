'use client'

import { useState } from 'react';
import { BrainCanvas } from './BrainCanvas';
import { PointCloudCanvas } from './PointCloudCanvas';
import type { BrainRegionScores } from '@/types/patient';
import { Slider } from '@/components/ui/slider';

interface VisualizationComparisonProps {
  regionScores: BrainRegionScores;
}

type VisualizationType = 'mesh' | 'pointcloud';

interface ViewSelectorProps {
  value: VisualizationType;
  onChange: (v: VisualizationType) => void;
  label: string;
}

function ViewSelector({ value, onChange, label }: ViewSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('mesh')}
          className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
            value === 'mesh'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🎨 3D Mesh
        </button>
        <button
          type="button"
          onClick={() => onChange('pointcloud')}
          className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
            value === 'pointcloud'
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          ✨ Point Cloud
        </button>
      </div>
    </div>
  );
}

export function VisualizationComparison({ regionScores }: VisualizationComparisonProps) {
  const [leftView, setLeftView] = useState<VisualizationType>('mesh');
  const [rightView, setRightView] = useState<VisualizationType>('pointcloud');
  const [pointDensity, setPointDensity] = useState(5000);

  const renderVisualization = (type: VisualizationType) => {
    const baseClasses = "bg-slate-900 rounded-lg border border-slate-700 overflow-hidden";

    if (type === 'mesh') {
      return (
        <div className={baseClasses}>
          <BrainCanvas regionScores={regionScores} />
        </div>
      );
    } else {
      return (
        <div className={baseClasses}>
          <PointCloudCanvas regionScores={regionScores} pointDensity={pointDensity} />
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ViewSelector value={leftView} onChange={setLeftView} label="Left View" />
          <ViewSelector value={rightView} onChange={setRightView} label="Right View" />

          {/* Point density control - always show since at least one view might be pointcloud */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Point Density: {pointDensity.toLocaleString()}
            </label>
            <Slider
              value={[pointDensity]}
              onValueChange={([value]) => setPointDensity(value)}
              min={1000}
              max={20000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Sparse (1K)</span>
              <span>Dense (20K)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {(leftView === 'pointcloud' || rightView === 'pointcloud')
                ? 'Adjust particle count for point cloud visualization'
                : 'Switch to Point Cloud view to adjust density'}
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left View */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 bg-purple-900/90 px-3 py-1 rounded text-sm font-semibold border border-purple-700">
            Left: {leftView === 'mesh' ? '🎨 3D Mesh' : '✨ Point Cloud'}
          </div>
          {renderVisualization(leftView)}
          <div className="mt-3 text-xs text-slate-400 text-center">
            {leftView === 'mesh' && 'Solid 3D model with smooth surfaces and region-specific coloring'}
            {leftView === 'pointcloud' && `Particle-based visualization with ${pointDensity.toLocaleString()} points showing depth and structure`}
          </div>
        </div>

        {/* Right View */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 bg-blue-900/90 px-3 py-1 rounded text-sm font-semibold border border-blue-700">
            Right: {rightView === 'mesh' ? '🎨 3D Mesh' : '✨ Point Cloud'}
          </div>
          {renderVisualization(rightView)}
          <div className="mt-3 text-xs text-slate-400 text-center">
            {rightView === 'mesh' && 'Solid 3D model with smooth surfaces and region-specific coloring'}
            {rightView === 'pointcloud' && `Particle-based visualization with ${pointDensity.toLocaleString()} points showing depth and structure`}
          </div>
        </div>
      </div>

      {/* Quick comparison info */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="text-sm text-slate-300 space-y-2">
          <div className="font-semibold">Visualization Techniques:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-purple-400 font-semibold">3D Mesh:</span>
              <span className="text-slate-400 ml-2">Traditional solid rendering with surface materials. Best for detailed structure visualization.</span>
            </div>
            <div>
              <span className="text-blue-400 font-semibold">Point Cloud:</span>
              <span className="text-slate-400 ml-2">Particle-based rendering with customizable density. Best for seeing internal structure and depth.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
