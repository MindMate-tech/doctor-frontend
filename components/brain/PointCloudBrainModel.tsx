'use client'

import { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { scoreToColor, scoreToLabel } from './colorUtils';
import type { BrainRegionScores, BrainRegionKey } from '@/types/patient';

interface PointCloudBrainModelProps {
  regionScores: BrainRegionScores;
}

export function PointCloudBrainModel({ regionScores }: PointCloudBrainModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{ regionKey: BrainRegionKey; position: THREE.Vector3 } | null>(null);
  
  const { scene } = useGLTF('/models/brain-pointcloud.glb');
  const clonedScene = useRef(scene.clone());
  
  /**
   * Map point cloud objects to brain regions
   * You have 19 objects and 6 regions, so some regions will have multiple objects
   * Adjust this mapping based on visual inspection!
   */
  const objectToRegion: Record<string, { key: BrainRegionKey; label: string }> = {
    // Assuming front objects are prefrontal cortex
    'Object_0': { key: 'prefrontalCortex', label: 'Prefrontal Cortex' },
    'Object_1': { key: 'prefrontalCortex', label: 'Prefrontal Cortex' },
    'Object_2': { key: 'prefrontalCortex', label: 'Prefrontal Cortex' },
    
    // Temporal lobes (sides) - mapped to parietal lobe
    'Object_3': { key: 'parietalLobe', label: 'Parietal Lobe' },
    'Object_4': { key: 'parietalLobe', label: 'Parietal Lobe' },
    'Object_5': { key: 'parietalLobe', label: 'Parietal Lobe' },
    
    // Parietal lobe (top)
    'Object_6': { key: 'parietalLobe', label: 'Parietal Lobe' },
    'Object_7': { key: 'parietalLobe', label: 'Parietal Lobe' },
    'Object_8': { key: 'parietalLobe', label: 'Parietal Lobe' },
    
    // Hippocampus (deep structures)
    'Object_9': { key: 'hippocampus', label: 'Hippocampus' },
    'Object_10': { key: 'hippocampus', label: 'Hippocampus' },
    
    // Amygdala
    'Object_11': { key: 'amygdala', label: 'Amygdala' },
    'Object_12': { key: 'amygdala', label: 'Amygdala' },
    
    // Cerebellum (back/bottom)
    'Object_13': { key: 'cerebellum', label: 'Cerebellum' },
    'Object_14': { key: 'cerebellum', label: 'Cerebellum' },
    'Object_15': { key: 'cerebellum', label: 'Cerebellum' },
    'Object_16': { key: 'cerebellum', label: 'Cerebellum' },
    
    // Additional regions - distribute as needed
    'Object_17': { key: 'parietalLobe', label: 'Parietal Lobe' },
    'Object_18': { key: 'prefrontalCortex', label: 'Prefrontal Cortex' },
  };
  
  // Debug: Log point cloud info
  useEffect(() => {
    const currentScene = clonedScene.current;
    
    console.group('☁️ POINT CLOUD DEBUG');
    currentScene.traverse((child) => {
      if (child instanceof THREE.Points) {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        
        const mapping = objectToRegion[child.name];
        console.log(`${child.name}:`, {
          position: `x:${worldPos.x.toFixed(2)}, y:${worldPos.y.toFixed(2)}, z:${worldPos.z.toFixed(2)}`,
          points: child.geometry.attributes.position?.count || 0,
          hasColor: !!child.geometry.attributes.color,
          assignedTo: mapping?.label || 'Not mapped',
        });
      }
    });
    console.groupEnd();
  }, []);
  
  // Apply colors to point clouds
  useEffect(() => {
    const currentScene = clonedScene.current;
    let coloredCount = 0;
    
    currentScene.traverse((child) => {
      if (child instanceof THREE.Points) {
        const mapping = objectToRegion[child.name];
        
        if (mapping) {
          const score = regionScores[mapping.key];
          const color = scoreToColor(score);
          
          // Create new PointsMaterial with our color
          child.material = new THREE.PointsMaterial({
            color: color,
            size: 0.015,  // Point size - adjust for visibility
            sizeAttenuation: true,  // Points get smaller with distance
            transparent: true,
            opacity: 0.8,
            vertexColors: false,  // Override original colors
          });
          
          coloredCount++;
        }
      }
    });
    
    console.log(`✅ Colored ${coloredCount}/19 point cloud objects`);
  }, [regionScores]);
  
  // Smooth color transitions and rotation
  useFrame(() => {
    const currentScene = clonedScene.current;
    
    currentScene.traverse((child) => {
      if (child instanceof THREE.Points) {
        const mapping = objectToRegion[child.name];
        
        if (mapping && child.material instanceof THREE.PointsMaterial) {
          const targetColor = scoreToColor(regionScores[mapping.key]);
          child.material.color.lerp(targetColor, 0.1);
        }
      }
    });
    
    // Rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });
  
  // Handle hover (raycasting on point clouds)
  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    const points = event.object;
    
    if (points instanceof THREE.Points) {
      const mapping = objectToRegion[points.name];
      
      if (mapping) {
        const worldPosition = new THREE.Vector3();
        points.getWorldPosition(worldPosition);
        
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
        <Html position={[hoveredInfo.position.x, hoveredInfo.position.y + 1, hoveredInfo.position.z]}>
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

useGLTF.preload('/models/brain-pointcloud.glb');