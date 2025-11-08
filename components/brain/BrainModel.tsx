'use client'

import { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { scoreToColor, scoreToLabel } from './colorUtils';
import type { BrainRegionScores, BrainRegionKey } from '@/types/patient';

interface BrainModelProps {
  regionScores: BrainRegionScores;
}

export function BrainModel({ regionScores }: BrainModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{ regionKey: BrainRegionKey; position: THREE.Vector3 } | null>(null);
  
  const { scene } = useGLTF('/models/brain.glb');
  const clonedScene = useRef(scene.clone());
  
  const meshToRegion: Record<string, { key: BrainRegionKey; label: string }> = {
    'Brain_Part_01_Colour_Brain_Texture_0': {
      key: 'amygdala',
      label: 'Amygdala',
    },
    'Brain_Part_02_Colour_Brain_Texture_0': {
      key: 'cerebellum',
      label: 'Cerebellum',
    },
    'Brain_Part_03_Colour_Brain_Texture_0': {
      key: 'hippocampus',
      label: 'Hippocampus',
    },
    'Brain_Part_04_Colour_Brain_Texture_0': {
      key: 'prefrontalCortex',
      label: 'Prefrontal Cortex (Left Hemisphere)',
    },
    'Brain_Part_05_Colour_Brain_Texture_0': {
      key: 'brainStem',
      label: 'Brain Stem',
    },
    'Brain_Part_06_Colour_Brain_Texture_0': {
      key: 'parietalLobe',
      label: 'Parietal Lobe (Right Hemisphere)',
    },
  };
  
  // Log positions on first load
  useEffect(() => {
    const currentScene = clonedScene.current;
    
    console.group('🧠 BRAIN PART POSITIONS');
    currentScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        
        const mapping = meshToRegion[child.name];
        console.log(`${child.name}:`, {
          position: `x:${worldPos.x.toFixed(2)}, y:${worldPos.y.toFixed(2)}, z:${worldPos.z.toFixed(2)}`,
          vertices: child.geometry.attributes.position?.count || 0,
          assignedTo: mapping?.label || 'Not mapped',
        });
      }
    });
    console.groupEnd();
  }, []);
  
  // Apply colors - COMPLETELY REPLACE MATERIALS
  useEffect(() => {
    const currentScene = clonedScene.current;
    let coloredCount = 0;
    
    currentScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mapping = meshToRegion[child.name];
        
        if (mapping) {
          const score = regionScores[mapping.key];
          const color = scoreToColor(score);
          
          // FORCE NEW MATERIAL - Remove all textures and old materials
          child.material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.2,
            // Explicitly disable all texture maps
            map: null,
            normalMap: null,
            roughnessMap: null,
            metalnessMap: null,
            aoMap: null,
            emissiveMap: null,
          });
          
          coloredCount++;
        }
      }
    });
    
    console.log(`✅ Replaced materials for ${coloredCount}/6 brain parts`);
  }, [regionScores]);
  
  // Smooth color transitions
  useFrame(() => {
    const currentScene = clonedScene.current;
    
    currentScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mapping = meshToRegion[child.name];
        
        if (mapping && child.material instanceof THREE.MeshStandardMaterial) {
          const targetColor = scoreToColor(regionScores[mapping.key]);
          
          // Smoothly interpolate colors
          child.material.color.lerp(targetColor, 0.1);
          child.material.emissive.lerp(targetColor, 0.1);
        }
      }
    });
    
    // Slow rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });
  
  // Handle hover with priority-based raycast selection
  const handlePointerOver = (event: any) => {
    event.stopPropagation();

    // Priority ranking: smaller/internal structures > larger/external structures
    // Lower number = higher priority
    const REGION_PRIORITY: Record<BrainRegionKey, number> = {
      hippocampus: 1,       // Highest priority - deep internal structure
      amygdala: 2,          // High priority - internal structure
      brainStem: 3,         // Medium-high priority - central structure
      cerebellum: 4,        // Medium priority - posterior structure
      prefrontalCortex: 5,  // Lower priority - large hemisphere
      parietalLobe: 6,      // Lowest priority - large hemisphere
    };

    // Get ALL intersections from the raycast (not just the first one)
    const allIntersections = event.intersections || [];

    let selectedMesh: THREE.Mesh | null = null;
    let highestPriority = Infinity;

    // Loop through all intersections and select the one with highest priority
    for (const intersection of allIntersections) {
      const mesh = intersection.object;

      // Only process THREE.Mesh objects
      if (!(mesh instanceof THREE.Mesh)) continue;

      // Check if this mesh is mapped to a brain region
      const mapping = meshToRegion[mesh.name];
      if (!mapping) continue;

      // Get priority for this region (default to Infinity if not found)
      const priority = REGION_PRIORITY[mapping.key] ?? Infinity;

      // Select this mesh if it has higher priority than current selection
      if (priority < highestPriority) {
        highestPriority = priority;
        selectedMesh = mesh;
      }
    }

    // If we found a valid mesh, show the tooltip
    if (selectedMesh) {
      const mapping = meshToRegion[selectedMesh.name];

      if (mapping) {
        const worldPosition = new THREE.Vector3();
        selectedMesh.getWorldPosition(worldPosition);

        setHoveredInfo({
          regionKey: mapping.key,
          position: worldPosition,
        });
        document.body.style.cursor = 'pointer';
      }
    }
  };
  
  const handlePointerOut = () => {
    setHoveredInfo(null);
    document.body.style.cursor = 'default';
  };
  
  return (
    <>
      <group
        ref={groupRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <primitive object={clonedScene.current} />
      </group>
      
      {/* Tooltip */}
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