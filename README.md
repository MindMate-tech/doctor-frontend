# Cognitive Health Monitor

A real-time cognitive health monitoring platform that visualizes brain region health scores using advanced 3D point cloud rendering. This application provides doctors and researchers with an intuitive interface to analyze patient cognitive data through interactive brain visualizations.

## Overview

The Cognitive Health Monitor transforms complex neurological data into accessible visual representations. Using point cloud technology, the platform renders brain regions with color-coded particles that indicate cognitive health scores, making it easier to identify areas of concern at a glance.

The system tracks multiple brain regions including the hippocampus, prefrontal cortex, brain stem, parietal lobe, amygdala, and cerebellum. Each region receives a health score that gets visualized in 3D space, allowing for comprehensive spatial analysis of cognitive function.


## Tech Stack

This project is built with modern web technologies optimized for performance and developer experience:

- **Next.js 16** - React framework with App Router and React Server Components
- **React 19** - Latest React with improved concurrent rendering
- **TypeScript** - Full type safety across the entire codebase
- **Three.js** - 3D graphics rendering via @react-three/fiber and @react-three/drei

- **Zustand** - Lightweight state management for patient data
- **Tailwind CSS 4** - Utility-first styling with the latest features
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Data visualization for metrics and charts

## Getting Started

### Prerequisites

Make sure you have the following installed on your system:

- Node.js 20 or higher
- npm or yarn package manager
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd doctor-frontend
npm install
```

### Running the Development Server

Start the development server with hot reload:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the Cognitive Health Monitor dashboard with a default patient loaded.

### Building for Production

Create an optimized production build:

```bash
npm run build
npm start
```

The build process optimizes bundle sizes and enables performance features like static generation and incremental static regeneration.

## Usage

### Viewing Patient Data

When the application loads, it displays a default patient with moderate cognitive decline. The main dashboard shows:

- Patient identification and overall cognitive score
- Memory retention rate
- Last update timestamp
- A dropdown to switch between different patient conditions

### Interacting with the 3D Brain

The point cloud visualization supports several interactions:

- **Rotate** - Click and drag to rotate the brain model
- **Zoom** - Scroll to zoom in and out
- **Auto-rotate** - The brain slowly rotates automatically for better viewing angles

Each particle in the point cloud represents a small volume of brain tissue, colored according to its health score:

- Red: Severe decline (0-30%)
- Orange: Moderate decline (30-50%)
- Yellow-Green gradient: Below average (50-70%)
- Green: Healthy (70-90%)
- Cyan: Excellent (90-100%)

### Patient Profiles

The system includes four pre-configured patient profiles for demonstration:

- **Healthy Patient** - All brain regions functioning at optimal levels
- **Mild Cognitive Decline** - Slight decreases in some regions
- **Moderate Cognitive Decline** - Noticeable impairment in multiple areas
- **Severe Cognitive Decline** - Significant impairment requiring intervention

## Development Notes

### Adding New Brain Regions

To add a new brain region to track:

1. Update the `BrainRegionScores` interface in [types/patient.ts](types/patient.ts)
2. Add the region's geometry data to the point cloud generator
3. Update mock data in [lib/mockData/patientGenerator.ts](lib/mockData/patientGenerator.ts)

### Customizing the Color Scale

The color gradient is defined in [components/brain/colorUtils.ts](components/brain/colorUtils.ts). Modify the `scoreToColor` function to adjust thresholds or colors.

## Performance Considerations

The 3D rendering can be resource-intensive. If you experience performance issues:

- Reduce the `pointDensity` prop on the PointCloudCanvas component (default is 4000)
- Disable auto-rotation in the canvas settings
- Ensure hardware acceleration is enabled in your browser

## Future Enhancements

Potential features on the roadmap:

- Real-time data streaming from medical devices
- Historical trend analysis with time-series graphs
- Multi-patient comparison views
- Export reports as PDF
- Advanced filtering and search capabilities
- Integration with electronic health record (EHR) systems
- Mobile native applications

## MRI Upload MVP

The chat page now supports attaching MRI studies so they can be routed through the backend agent pipeline. A few pieces of configuration are required before the feature will work end-to-end:

1. **Supabase resources (configure via the Supabase dashboard):**
   - Create a private storage bucket named `mri_images` (or set a different name in `MRI_STORAGE_BUCKET`).
   - Add the `mri_scans` table:
     ```sql
     create table public.mri_scans (
       scan_id uuid primary key default gen_random_uuid(),
       patient_id uuid references public.patients(patient_id),
       uploaded_by uuid references public.doctors(doctor_id),
       storage_path text not null,
       original_filename text not null,
       status text not null default 'pending',
       analysis jsonb,
       created_at timestamptz not null default now()
     );
     ```
   - (Optional) Seed a demo doctor row if you want `uploaded_by` to be non-null.

2. **Environment variables (`.env.local`):**
   ```bash
   SUPABASE_URL=<your-supabase-project-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   MRI_STORAGE_BUCKET=mri_images              # optional, defaults to mri_images
   MRI_DEMO_DOCTOR_ID=<uuid-of-demo-doctor>   # optional, used until real auth is wired
   ```

3. **Manual steps the app cannot perform automatically:**
   - Grant the service role key access to the storage bucket.
   - Confirm your deployment platform (e.g., Vercel) also has the same environment variables.
   - Wire the backend classifier/agent to poll `mri_scans` for rows where `status = 'pending'` and update them after processing.

Once configured, the Clinical Assistant chat enforces a single active patient context (via the dashboard’s patient selector) before enabling uploads. Files are validated client-side (extension + 50 MB limit), streamed to `/api/mri/upload`, stored in Supabase, and a metadata row is appended to `mri_scans` so your backend agent can continue the workflow. Allowed formats include DICOM, NIfTI, JPG/PNG screenshots, and zipped DICOM studies.
