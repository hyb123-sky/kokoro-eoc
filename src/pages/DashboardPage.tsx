// ============================================
// KOKORO EOC - Dashboard Page
// ============================================
// メインダッシュボードページ

import React, { useState, useEffect, useCallback } from 'react';
import MapPanel from '../components/map/MapPanel';
import IncidentPanel from '../components/incidents/IncidentPanel';
import ResourcePanel from '../components/resources/ResourcePanel';
import EarthquakePanel from '../components/earthquake/EarthquakePanel';
import StatsOverview from '../components/dashboard/StatsOverview';

// ============================================
// Dashboard Page Component
// ============================================
const DashboardPage: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<any[]>([]);
  const [isLoadingQuakes, setIsLoadingQuakes] = useState(true);
  const [quakeError, setQuakeError] = useState(false);

  const fetchEarthquakes = useCallback(async () => {
    setIsLoadingQuakes(true);
    setQuakeError(false);
    try {
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setEarthquakes(data.features || []);
    } catch (err) {
      console.error('USGS API Fetch Error:', err);
      setQuakeError(true);
    } finally {
      setIsLoadingQuakes(false);
    }
  }, []);

  useEffect(() => {
    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 300000); // 300000ms = 5分钟
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

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
          <MapPanel earthquakes={earthquakes} />
        </div>

        {/* Right Column - Earthquake Activity */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <EarthquakePanel 
            earthquakes={earthquakes}
            isLoading={isLoadingQuakes}
            error={quakeError}
            refetch={fetchEarthquakes}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
