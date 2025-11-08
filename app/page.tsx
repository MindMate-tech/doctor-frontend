'use client'

import { useEffect } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { MOCK_PATIENTS } from '@/lib/mockData/patientGenerator';
import { PointCloudCanvas } from '@/components/brain/PointCloudCanvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { scoreToColor } from '@/components/brain/colorUtils';

export default function Home() {
  const { currentPatient, setPatient } = usePatientStore();

  useEffect(() => {
    setPatient(MOCK_PATIENTS.moderate);
  }, [setPatient]);

  if (!currentPatient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Cognitive Health Monitor</h1>
          <p className="text-slate-400 text-sm">
            Real-time brain region analysis with advanced visualization
          </p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Patient Info */}
        <Card className="mb-6 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentPatient.patientName}</span>
              <Badge variant="outline" className="text-xs">
                ID: {currentPatient.patientId}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-400">Overall Score</div>
                <div className="text-3xl font-bold">
                  {currentPatient.overallCognitiveScore}
                  <span className="text-sm text-slate-400 ml-1">/100</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Memory Retention</div>
                <div className="text-3xl font-bold">
                  {currentPatient.memoryRetentionRate}
                  <span className="text-sm text-slate-400 ml-1">%</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Last Updated</div>
                <div className="text-sm font-mono mt-2">
                  {new Date(currentPatient.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-slate-300">
            Patient Condition
          </label>
          <select
            className="w-full max-w-xs px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const condition = e.target.value as keyof typeof MOCK_PATIENTS;
              setPatient(MOCK_PATIENTS[condition]);
            }}
            defaultValue="moderate"
          >
            <option value="healthy">Healthy Patient</option>
            <option value="mild">Mild Cognitive Decline</option>
            <option value="moderate">Moderate Cognitive Decline</option>
            <option value="severe">Severe Cognitive Decline</option>
          </select>
        </div>

        {/* Visualization */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>3D Brain Point Cloud Visualization</CardTitle>
            <p className="text-sm text-slate-400">
              Particle-based brain rendering showing cognitive health scores with 4,000 points
            </p>
          </CardHeader>
          <CardContent>
            <PointCloudCanvas regionScores={currentPatient.brainRegions} pointDensity={4000} />

            {/* Color Legend - using actual scoreToColor values */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgb(${scoreToColor(0.15).r * 255}, ${scoreToColor(0.15).g * 255}, ${scoreToColor(0.15).b * 255})` }}
                ></div>
                <span className="text-slate-300">Severe (0-30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgb(${scoreToColor(0.40).r * 255}, ${scoreToColor(0.40).g * 255}, ${scoreToColor(0.40).b * 255})` }}
                ></div>
                <span className="text-slate-300">Moderate (30-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgb(${scoreToColor(0.60).r * 255}, ${scoreToColor(0.60).g * 255}, ${scoreToColor(0.60).b * 255})` }}
                ></div>
                <span className="text-slate-300">Below Avg (50-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgb(${scoreToColor(0.80).r * 255}, ${scoreToColor(0.80).g * 255}, ${scoreToColor(0.80).b * 255})` }}
                ></div>
                <span className="text-slate-300">Healthy (70-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgb(${scoreToColor(0.95).r * 255}, ${scoreToColor(0.95).g * 255}, ${scoreToColor(0.95).b * 255})` }}
                ></div>
                <span className="text-slate-300">Excellent (90-100%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
