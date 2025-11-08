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
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Patient Info */}
        <Card className="mb-6 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>{patient.patientName}</span>
              <Badge variant="outline" className="text-xs text-white">
                ID: {patient.patientId}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-white">Overall Score</div>
                <div className="text-3xl text-white font-bold">
                  {(patient.overallCognitiveScore * 100).toFixed(0)}
                  <span className="text-sm text-white ml-1">/100</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-white">Memory Retention</div>
                <div className="text-3xl text-white font-bold">
                  {patient.memoryRetentionRate}
                  <span className="text-sm text-white ml-1">%</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-white">Last Updated</div>
                <div className="text-sm text-white font-mono mt-2">
                  {new Date(patient.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

  <DeclineAlert />
  <MetricsList patient={patient} />

        {/* Memory timeline chart */}
        <Card className="my-6 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Memory Timeline</CardTitle>
            <p className="text-sm text-white">Short-term and long-term memory scores over the last month</p>
          </CardHeader>
          <CardContent>
            <MemoryTimelineChart memoryMetrics={patient.memoryMetrics} series={["shortTermRecall", "longTermRecall"]} heightClass="h-56" />
          </CardContent>
        </Card>

        {/* Recent activity feed */}
        <Card className="my-6 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityFeed maxItems={6} />
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="mb-6">
          <label htmlFor="patient-condition" className="block text-sm font-medium mb-2 text-white">
            Patient Condition
          </label>
          <select
            id="patient-condition"
            aria-label="Patient condition selector"
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
            <CardTitle className="text-white">3D Brain Point Cloud Visualization</CardTitle>
            <p className="text-sm text-white">
              Particle-based brain rendering showing cognitive health scores with 4,000 points
            </p>
          </CardHeader>
          <CardContent>
            <PointCloudCanvas regionScores={patient.brainRegions} pointDensity={4000} />

            {/* Color Legend - using actual scoreToColor values */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600" />
                <span className="text-white">Severe (0-30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span className="text-white">Moderate (30-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-400" />
                <span className="text-white">Below Avg (50-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-400" />
                <span className="text-white">Healthy (70-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-400" />
                <span className="text-white">Excellent (90-100%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
