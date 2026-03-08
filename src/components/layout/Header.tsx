// ============================================
// KOKORO EOC - Header Component (with Router)
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Settings,
  Search,
  Radio,
  Activity,
  Wifi,
  WifiOff,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { useAppStore, useNotificationStore, useAICopilotStore } from '../../stores';
import { useQueryClient } from '@tanstack/react-query';

// ============================================
// Clock Component
// ============================================
const Clock: React.FC = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  return (
    <div className="text-right">
      <div className="font-mono text-lg text-kokoro-accent tracking-wider">
        {formatTime(time)}
      </div>
      <div className="font-mono text-xs text-kokoro-muted">
        {formatDate(time)}
      </div>
    </div>
  );
};

// ============================================
// System Status Indicator
// ============================================
const SystemStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-kokoro-darker rounded-lg border border-kokoro-border">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-kokoro-success" />
        ) : (
          <WifiOff className="w-4 h-4 text-status-critical animate-pulse" />
        )}
        <span className="font-mono text-xs text-kokoro-muted">
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
      
      <div className="w-px h-4 bg-kokoro-border" />
      
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-kokoro-accent animate-pulse" />
        <span className="font-mono text-xs text-kokoro-muted">ACTIVE</span>
      </div>
      
      <div className="w-px h-4 bg-kokoro-border" />
      
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-kokoro-success" />
        <span className="font-mono text-xs text-kokoro-muted">SN:OK</span>
      </div>
    </div>
  );
};

// ============================================
// Main Header Component
// ============================================
const Header: React.FC = () => {
  const navigate = useNavigate();
  const { toggleSidebar } = useAppStore();
  const { unreadCount } = useNotificationStore();
  const { toggleCopilot } = useAICopilotStore();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="h-16 bg-kokoro-panel border-b border-kokoro-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="btn-icon text-kokoro-muted hover:text-white"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-kokoro-accent/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-kokoro-accent" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white tracking-wider">
              KOKORO
            </h1>
            <p className="font-mono text-[10px] text-kokoro-muted -mt-1">
              災害対応指揮センター
            </p>
          </div>
        </button>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kokoro-muted" />
          <input
            type="text"
            placeholder="インシデント、リソース、場所を検索..."
            className="w-full pl-10 pr-4 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white placeholder-kokoro-muted focus:outline-none focus:border-kokoro-accent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* System Status */}
        <SystemStatus />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-2 text-kokoro-muted hover:text-kokoro-accent rounded-lg hover:bg-kokoro-darker"
            title="データを更新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* AI Copilot */}
          <button
            onClick={toggleCopilot}
            className="p-2 text-kokoro-muted hover:text-kokoro-accent rounded-lg hover:bg-kokoro-darker relative"
            title="AI Copilot"
          >
            <Bot className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-kokoro-accent rounded-full animate-pulse" />
          </button>

          {/* Notifications */}
          <button
            className="p-2 text-kokoro-muted hover:text-white rounded-lg hover:bg-kokoro-darker relative"
            title="通知"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-status-critical text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-kokoro-muted hover:text-white rounded-lg hover:bg-kokoro-darker"
            title="設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-kokoro-border" />

        {/* Clock */}
        <Clock />
      </div>
    </header>
  );
};

export default Header;
