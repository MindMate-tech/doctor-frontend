"use client"

import { useEffect } from 'react';
import usePatientStore from '@/store/patientStore';
import { MOCK_PATIENTS } from '@/lib/mockData/patientGenerator';
import { PointCloudCanvas } from '@/components/brain/PointCloudCanvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MetricsList from '@/components/dashboard/MetricsList';
import usePatientPolling from '@/hooks/usePatientPolling';
import MemoryTimelineChart from '@/components/dashboard/MemoryTimelineChart';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import DeclineAlert from '@/components/dashboard/DeclineAlert';

export default function Home() {
  const { patient, setPatient } = usePatientStore();

  // Start the mock poller to simulate live updates (MVP/demo friendly)
  // intervalMs is 10s here for a visible demo cadence; increase to 30000 for production-like timing.
  usePatientPolling({ enabled: true, intervalMs: 10000 });

  useEffect(() => {
    setPatient(MOCK_PATIENTS.moderate);
  }, [setPatient]);

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-300 text-lg">Loading patient data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-[1800px]">
        {/* Patient Info Header */}
        <Card className="mb-8 bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-2xl font-bold text-white">{patient.patientName}</span>
              <Badge variant="outline" className="text-xs text-slate-300 border-slate-700 w-fit">
                ID: {patient.patientId}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <div className="text-sm text-slate-400 mb-1.5">Overall Score</div>
                <div className="text-4xl font-bold text-white tracking-tight">
                  {(patient.overallCognitiveScore * 100).toFixed(0)}
                  <span className="text-lg text-slate-400 ml-1 font-normal">/100</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-slate-400 mb-1.5">Memory Retention</div>
                <div className="text-4xl font-bold text-white tracking-tight">
                  {patient.memoryRetentionRate}
                  <span className="text-lg text-slate-400 ml-1 font-normal">%</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-slate-400 mb-1.5">Last Updated</div>
                <div className="text-sm text-slate-200 font-mono mt-2">
                  {new Date(patient.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid - Left: Data, Right: 3D Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column - Data & Metrics */}
          <div className="flex flex-col gap-6">
            <DeclineAlert />
            <MetricsList patient={patient} />

            {/* Memory timeline chart */}
            <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">Memory Timeline</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Short-term and long-term memory scores over the last month</p>
              </CardHeader>
              <CardContent>
                <MemoryTimelineChart memoryMetrics={patient.memoryMetrics} series={["shortTermRecall", "longTermRecall"]} heightClass="h-64" />
              </CardContent>
            </Card>

            {/* Recent activity feed */}
            <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivityFeed maxItems={6} />
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Demo Controls</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Switch between different patient conditions</p>
              </CardHeader>
              <CardContent>
                <label htmlFor="patient-condition" className="block text-sm font-medium mb-3 text-slate-300">
                  Patient Condition
                </label>
                <select
                  id="patient-condition"
                  aria-label="Patient condition selector"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 3D Visualization (Sticky) */}
          <div className="lg:sticky lg:top-24">
            <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">3D Brain Visualization</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  High-resolution interactive point cloud with 8,000 particles
                </p>
              </CardHeader>
              <CardContent>
                <PointCloudCanvas regionScores={patient.brainRegions} pointDensity={8000} />

                {/* Color Legend */}
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded shadow-sm bg-red-600" />
                    <span className="text-slate-300">Severe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded shadow-sm bg-orange-500" />
                    <span className="text-slate-300">Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded shadow-sm bg-yellow-400" />
                    <span className="text-slate-300">Below Avg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded shadow-sm bg-green-400" />
                    <span className="text-slate-300">Healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded shadow-sm bg-cyan-400" />
                    <span className="text-slate-300">Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
