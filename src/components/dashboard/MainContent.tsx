// ============================================
// KOKORO EOC - Main Content Component
// ============================================

import React from 'react';
import MapPanel from '../map/MapPanel';
import IncidentPanel from '../incidents/IncidentPanel';
import ResourcePanel from '../resources/ResourcePanel';
import EarthquakePanel from '../earthquake/EarthquakePanel';
import StatsOverview from './StatsOverview';

// ============================================
// Main Content Layout
// ============================================
const MainContent: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-kokoro-dark">
      {/* Stats Bar */}
      <StatsOverview />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column - Incidents & Resources */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <IncidentPanel />
          <ResourcePanel />
        </div>

        {/* Center Column - Map (Primary Focus) */}
        <div className="col-span-6 overflow-hidden">
          <MapPanel />
        </div>

        {/* Right Column - Earthquake Activity */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <EarthquakePanel />
        </div>
      </div>
    </main>
  );
};

export default MainContent;
