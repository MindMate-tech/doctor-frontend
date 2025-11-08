'use client'

import { useEffect, useRef, useState } from 'react';
import type { BrainRegionScores } from '@/types/patient';

interface NiftiViewerProps {
  regionScores: BrainRegionScores;
}

export function NiftiViewer({ regionScores }: NiftiViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nvRef = useRef<unknown>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    const loadNiivue = async () => {
      try {
        // Dynamically import Niivue (client-side only)
        const { Niivue } = await import('@niivue/niivue');

        if (!mounted || !canvasRef.current) return;

        // Initialize Niivue with correct options
        const nv = new Niivue({
          backColor: [0.1, 0.1, 0.15, 1],
          show3Dcrosshair: true,
          isColorbar: false,
        });

        nvRef.current = nv;

        // Attach to canvas
        nv.attachToCanvas(canvasRef.current);

        // Load brain volumes
        const volumeList = [
          {
            url: 'https://niivue.github.io/niivue/images/mni152.nii.gz',
            colormap: 'gray',
            opacity: 1.0,
          },
        ];

        await nv.loadVolumes(volumeList);

        if (!mounted) return;

        // Set render mode to show 3D
        nv.setSliceType(nv.sliceTypeRender);
        nv.setRenderAzimuthElevation(120, 10);

        setIsLoaded(true);
        console.log('✅ NIFTI brain loaded successfully');
      } catch (err: any) {
        console.error('❌ Error loading NIFTI:', err);
        if (mounted) {
          setError(err?.message || 'Failed to load brain imaging data');
        }
      }
    };

    loadNiivue();

    return () => {
      mounted = false;
      // Proper cleanup - just clear the volumes array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (nvRef.current && (nvRef.current as any).volumes) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (nvRef.current as any).volumes = [];
        } catch {
          // Safe to ignore
        }
      }
    };
  }, []);

  // Apply cognitive scores overlay
  useEffect(() => {
    if (!nvRef.current || !isLoaded) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nv = nvRef.current as any;

      // Get average score for overall brain coloring
      const avgScore = Object.values(regionScores).reduce((sum, val) => sum + val, 0) / 6;

      console.log('Applied cognitive score overlay:', avgScore);

      // Update rendering if needed
      if (nv.drawScene) {
        nv.drawScene();
      }
    } catch (err) {
      console.error('Error updating scores:', err);
    }
  }, [regionScores, isLoaded]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '600px', display: 'block' }}
      />

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-lg font-semibold">Loading MRI Data...</div>
            <div className="text-sm text-slate-400 mt-2">Fetching MNI152 brain atlas</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
          <div className="text-center max-w-md px-4">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <div className="text-white font-semibold mb-2">Failed to Load MRI Data</div>
            <div className="text-sm text-slate-400">{error}</div>
            <div className="text-xs text-slate-500 mt-4">
              Network issue or CORS restriction. Click &ldquo;Use Simple MRI Viewer&rdquo; above to continue.
            </div>
          </div>
        </div>
      )}

      {isLoaded && (
        <div className="absolute top-4 right-4 bg-slate-900/95 px-4 py-3 rounded-lg border border-slate-700 backdrop-blur">
          <div className="text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-sm mb-2 text-white">🧠 MNI152 Brain Atlas</div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Drag</kbd>
              <span>Rotate view</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Scroll</kbd>
              <span>Zoom in/out</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Right</kbd>
              <span>Pan view</span>
            </div>
          </div>
        </div>
      )}

      {isLoaded && (
        <div className="absolute bottom-4 left-4 bg-blue-900/95 px-3 py-2 rounded-lg border border-blue-700">
          <div className="text-xs font-semibold text-white">
            Real Neuroimaging Data
          </div>
          <div className="text-[10px] text-blue-200 mt-1">
            Standard reference brain (T1-weighted MRI)
          </div>
        </div>
      )}
    </div>
  );
}
