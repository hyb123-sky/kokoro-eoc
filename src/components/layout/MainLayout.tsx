// ============================================
// KOKORO EOC - Main Layout Component
// ============================================
// 全ページ共通レイアウト

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAppStore } from '../../stores';
import clsx from 'clsx';

// ============================================
// Main Layout Component
// ============================================
const MainLayout: React.FC = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="h-screen flex flex-col bg-kokoro-dark overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} />

        {/* Page Content */}
        <main className={clsx(
          'flex-1 overflow-hidden transition-all duration-300',
          sidebarOpen ? 'ml-0' : 'ml-0'
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
