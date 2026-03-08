// ============================================
// KOKORO EOC - Router Configuration
// ============================================
// 企業級ルーティング設定

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// ============================================
// Lazy Load Pages for Code Splitting
// ============================================
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const IncidentsPage = lazy(() => import('../pages/IncidentsPage'));
const ResourcesPage = lazy(() => import('../pages/ResourcesPage'));
const MapPage = lazy(() => import('../pages/MapPage'));
const TeamsPage = lazy(() => import('../pages/TeamsPage'));
const SheltersPage = lazy(() => import('../pages/SheltersPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// ============================================
// Loading Fallback Component
// ============================================
const PageLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-kokoro-dark">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-kokoro-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-kokoro-muted text-sm">読み込み中...</p>
    </div>
  </div>
);

// ============================================
// Error Boundary Component
// ============================================
const ErrorPage: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-kokoro-dark">
    <div className="text-center">
      <h1 className="text-4xl font-display font-bold text-status-critical mb-4">エラー</h1>
      <p className="text-kokoro-muted mb-6">ページの読み込みに失敗しました</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80"
      >
        再読み込み
      </button>
    </div>
  </div>
);

// ============================================
// Route Configuration
// ============================================
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'incidents',
        element: (
          <Suspense fallback={<PageLoader />}>
            <IncidentsPage />
          </Suspense>
        ),
      },
      {
        path: 'incidents/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <IncidentsPage />
          </Suspense>
        ),
      },
      {
        path: 'resources',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResourcesPage />
          </Suspense>
        ),
      },
      {
        path: 'map',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MapPage />
          </Suspense>
        ),
      },
      {
        path: 'teams',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TeamsPage />
          </Suspense>
        ),
      },
      {
        path: 'shelters',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SheltersPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

// ============================================
// Router Provider Export
// ============================================
const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
