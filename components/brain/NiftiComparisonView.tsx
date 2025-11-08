'use client'

import { useState } from 'react';
import { BrainCanvas } from './BrainCanvas';
import { NiftiViewer } from './NiftiViewer';
import type { BrainRegionScores } from '@/types/patient';
import { scoreToColor, scoreToLabel } from './colorUtils';

interface SimpleMRIViewerProps {
  regionScores: BrainRegionScores;
}

export function SimpleMRIViewer({ regionScores }: SimpleMRIViewerProps) {
  const [sliceIndex, setSliceIndex] = useState(50);
  
  // Generate a grid visualization that looks like an MRI slice
  const renderMRISlice = () => {
    const cells = [];
    const gridSize = 20;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        // Create brain-like shape (rough circle)
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const isInBrain = distance < gridSize / 2.5;
        
        if (isInBrain) {
          // Determine which region this cell belongs to based on position
          let region: keyof BrainRegionScores = 'cerebellum';
          
          if (y < gridSize / 3) {
            region = 'prefrontalCortex';
          } else if (y < gridSize / 2) {
            region = x < gridSize / 3 || x > (2 * gridSize / 3)
              ? 'brainStem'
              : 'parietalLobe';
          } else if (distance < gridSize / 6) {
            region = 'hippocampus';
          } else if (distance < gridSize / 5) {
            region = 'amygdala';
          } else {
            region = 'cerebellum';
          }
          
          const score = regionScores[region];
          const color = scoreToColor(score);
          const rgbColor = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
          
          cells.push(
            <div
              key={`${x}-${y}`}
              className="border border-slate-800/30"
              style={{
                backgroundColor: rgbColor,
                opacity: 0.7,
              }}
            />
          );
        } else {
          cells.push(
            <div
              key={`${x}-${y}`}
              className="bg-slate-950"
            />
          );
        }
      }
    }
    
    return cells;
  };
  
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">
          Axial Slice #{sliceIndex}
        </div>
        <div className="text-xs text-slate-400">
          Scroll to change slice
        </div>
      </div>
      
      {/* MRI-style grid */}
      <div 
        className="grid gap-0 aspect-square max-w-[500px] mx-auto rounded-lg overflow-hidden border-2 border-slate-700"
        style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}
        onWheel={(e) => {
          e.preventDefault();
          setSliceIndex(prev => Math.max(1, Math.min(100, prev + (e.deltaY > 0 ? 1 : -1))));
        }}
      >
        {renderMRISlice()}
      </div>
      
      {/* Slice slider */}
      <div className="mt-6">
        <input
          type="range"
          min="1"
          max="100"
          value={sliceIndex}
          onChange={(e) => setSliceIndex(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Inferior</span>
          <span>Slice {sliceIndex}/100</span>
          <span>Superior</span>
        </div>
      </div>
      
      {/* Info badges */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-300">
          T1-weighted MRI
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-300">
          Axial view
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-300">
          1mm³ resolution
        </div>
      </div>
    </div>
  );
}

interface NiftiComparisonViewProps {
  regionScores: BrainRegionScores;
}

export function NiftiComparisonView({ regionScores }: NiftiComparisonViewProps) {
  const [useSimpleMRI, setUseSimpleMRI] = useState(false);

  return (
    <div className="space-y-4">
      {/* Toggle for fallback */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setUseSimpleMRI(!useSimpleMRI)}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          {useSimpleMRI ? 'Try Advanced MRI Viewer' : 'Use Simple MRI Viewer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Your 3D scored model */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 bg-purple-900/90 px-3 py-1 rounded text-sm font-semibold border border-purple-700">
            🎨 Cognitive Score Visualization
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
            <BrainCanvas regionScores={regionScores} />
            <div className="mt-3 text-xs text-slate-400 text-center">
              Interactive 3D model with region-specific cognitive scores
            </div>
          </div>
        </div>

        {/* Right: MRI data */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 bg-blue-900/90 px-3 py-1 rounded text-sm font-semibold border border-blue-700">
            🧠 MRI Anatomical Reference
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 min-h-[600px]">
            {useSimpleMRI ? (
              <SimpleMRIViewer regionScores={regionScores} />
            ) : (
              <NiftiViewer regionScores={regionScores} />
            )}
            <div className="mt-3 text-xs text-slate-400 text-center">
              {useSimpleMRI
                ? 'Stylized MRI slice view with cognitive overlay'
                : 'MNI152 standard brain atlas (real neuroimaging data)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}