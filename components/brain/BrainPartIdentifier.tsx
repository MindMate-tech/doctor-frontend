'use client'

import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BRAIN_PARTS = [
  'Brain_Part_01_Colour_Brain_Texture_0',
  'Brain_Part_02_Colour_Brain_Texture_0',
  'Brain_Part_03_Colour_Brain_Texture_0',
  'Brain_Part_04_Colour_Brain_Texture_0',
  'Brain_Part_05_Colour_Brain_Texture_0',
  'Brain_Part_06_Colour_Brain_Texture_0',
];

function BrainPartModel({ highlightedPart }: { highlightedPart: string }) {
  const { scene } = useGLTF('/models/brain.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Clone and modify the scene
  const modifiedScene = scene.clone();

  modifiedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const isHighlighted = child.name === highlightedPart;

      // Create new material
      child.material = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0x00ff00 : 0x333333, // Bright green for highlighted, dark gray for others
        emissive: isHighlighted ? 0x00ff00 : 0x000000,
        emissiveIntensity: isHighlighted ? 0.5 : 0,
        transparent: !isHighlighted,
        opacity: isHighlighted ? 1.0 : 0.15, // Very dim for non-highlighted parts
        roughness: 0.4,
        metalness: 0.2,
      });
    }
  });

  return <primitive ref={groupRef} object={modifiedScene} />;
}

export function BrainPartIdentifier() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPart = BRAIN_PARTS[currentIndex];
  const partNumber = currentIndex + 1;

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Brain Part Identifier</h2>

        <div className="grid grid-cols-6 gap-2 mb-4">
          {BRAIN_PARTS.map((part, idx) => (
            <button
              key={part}
              onClick={() => setCurrentIndex(idx)}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                idx === currentIndex
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Part {idx + 1}
            </button>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Currently Viewing:</div>
          <div className="text-lg font-bold text-green-400 font-mono">{currentPart}</div>
          <div className="text-xs text-slate-500 mt-2">
            The highlighted (bright green) part is {currentPart}. The other parts are dimmed.
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : BRAIN_PARTS.length - 1))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev < BRAIN_PARTS.length - 1 ? prev + 1 : 0))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          >
            Next →
          </button>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="w-full h-[600px] bg-gradient-to-b from-black via-slate-950 to-slate-900">
          <Canvas
            gl={{ antialias: true }}
          >
            <PerspectiveCamera makeDefault position={[3, 1.5, 3]} fov={50} />

            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />

            <BrainPartModel highlightedPart={currentPart} />

            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              minDistance={2}
              maxDistance={8}
            />
          </Canvas>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <div className="text-sm text-blue-200">
          <div className="font-semibold mb-2">📋 Instructions:</div>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Click through each part using the buttons above or Previous/Next</li>
            <li>Identify which brain region the highlighted (green) part represents</li>
            <li>Note down which Brain_Part_XX maps to which actual brain region</li>
            <li>Provide the correct mapping in the chat</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/brain.glb');
