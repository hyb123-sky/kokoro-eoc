// ============================================
// KOKORO EOC - Dashboard Page (Fixed)
// ============================================

import React from 'react';
import MapPanel from '../components/map/MapPanel';
import IncidentPanel from '../components/incidents/IncidentPanel';
import ResourcePanel from '../components/resources/ResourcePanel';
import EarthquakePanel from '../components/earthquake/EarthquakePanel';
import WeatherPanel from '../components/weather/WeatherPanel';
import StatsOverview from '../components/dashboard/StatsOverview';

// ============================================
// Dashboard Page Component
// ============================================
const DashboardPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-kokoro-dark">
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

        {/* Right Column - Weather & Earthquake Activity */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <WeatherPanel />
          <EarthquakePanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
