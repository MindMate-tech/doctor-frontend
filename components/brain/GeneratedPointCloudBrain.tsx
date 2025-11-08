'use client'

import { useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { scoreToColor, scoreToLabel } from './colorUtils';
import type { BrainRegionScores, BrainRegionKey } from '@/types/patient';

interface GeneratedPointCloudBrainProps {
  regionScores: BrainRegionScores;
  pointDensity?: number; // Points per mesh (default: 5000)
}

// Move this outside component - constant doesn't need to be recreated on every render
const meshToRegion: Record<string, { key: BrainRegionKey; label: string }> = {
  'Brain_Part_01_Colour_Brain_Texture_0': { key: 'amygdala', label: 'Amygdala' },
  'Brain_Part_02_Colour_Brain_Texture_0': { key: 'cerebellum', label: 'Cerebellum' },
  'Brain_Part_03_Colour_Brain_Texture_0': { key: 'hippocampus', label: 'Hippocampus' },
  'Brain_Part_04_Colour_Brain_Texture_0': { key: 'prefrontalCortex', label: 'Prefrontal Cortex (Left)' },
  'Brain_Part_05_Colour_Brain_Texture_0': { key: 'brainStem', label: 'Brain Stem' },
  'Brain_Part_06_Colour_Brain_Texture_0': { key: 'parietalLobe', label: 'Parietal Lobe (Right)' },
};

export function GeneratedPointCloudBrain({
  regionScores,
  pointDensity = 5000
}: GeneratedPointCloudBrainProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{ regionKey: BrainRegionKey; position: THREE.Vector3 } | null>(null);

  const { scene } = useGLTF('/models/brain.glb');

  // Generate point cloud data from meshes
  const pointClouds = useMemo(() => {
    const clouds: Array<{
      positions: Float32Array;
      colors: Float32Array;
      regionKey: BrainRegionKey;
      label: string;
    }> = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mapping = meshToRegion[child.name];
        if (!mapping) return;

        const geometry = child.geometry;
        const positions = geometry.attributes.position;
        const score = regionScores[mapping.key];
        const color = scoreToColor(score);

        // Sample points from mesh surface
        const sampledPositions: number[] = [];
        const sampledColors: number[] = [];

        // Get vertex count
        const vertexCount = positions.count;
        
        // Calculate how many points to sample
        const sampleCount = Math.min(pointDensity, vertexCount);
        
        // Sample points uniformly
        for (let i = 0; i < sampleCount; i++) {
          // Random vertex index
          const idx = Math.floor(Math.random() * vertexCount);
          
          // Get position
          const x = positions.getX(idx);
          const y = positions.getY(idx);
          const z = positions.getZ(idx);
          
          // Apply mesh transformation
          const worldPos = new THREE.Vector3(x, y, z);
          child.localToWorld(worldPos);
          
          sampledPositions.push(worldPos.x, worldPos.y, worldPos.z);
          
          // Add color with slight variation for depth effect
          const variation = 0.9 + Math.random() * 0.2; // 90-110% intensity
          sampledColors.push(color.r * variation, color.g * variation, color.b * variation);
        }

        clouds.push({
          positions: new Float32Array(sampledPositions),
          colors: new Float32Array(sampledColors),
          regionKey: mapping.key,
          label: mapping.label,
        });
      }
    });

    console.log(`✅ Generated ${clouds.length} point clouds with ${pointDensity} points each`);
    return clouds;
  }, [scene, regionScores, pointDensity]);

  // Smooth rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  const handlePointerOver = (regionKey: BrainRegionKey, event: any) => {
    event.stopPropagation();
    setHoveredInfo({
      regionKey,
      position: event.point,
    });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredInfo(null);
    document.body.style.cursor = 'default';
  };

  return (
    <>
      <group ref={groupRef}>
        {pointClouds.map((cloud, idx) => (
          <points
            key={`${cloud.regionKey}-${regionScores[cloud.regionKey]}`}
            onPointerOver={(e) => handlePointerOver(cloud.regionKey, e)}
            onPointerOut={handlePointerOut}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[cloud.positions, 3]}
              />
              <bufferAttribute
                attach="attributes-color"
                args={[cloud.colors, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.015}
              vertexColors
              sizeAttenuation
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        ))}
      </group>

      {hoveredInfo && (
        <Html position={[hoveredInfo.position.x, hoveredInfo.position.y + 0.5, hoveredInfo.position.z]}>
          <div className="bg-slate-900/95 text-white px-4 py-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
            <div className="font-semibold text-sm capitalize">
              {hoveredInfo.regionKey.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Score: {(regionScores[hoveredInfo.regionKey] * 100).toFixed(0)}%
              {' - '}
              {scoreToLabel(regionScores[hoveredInfo.regionKey])}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

useGLTF.preload('/models/brain.glb');