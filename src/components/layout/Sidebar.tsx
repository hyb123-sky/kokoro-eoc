// ============================================
// KOKORO EOC - Sidebar Component (with Routing)
// ============================================

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Package,
  Users,
  Map,
  Building2,
  FileText,
  Settings,
  Shield,
  ChevronRight,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../stores';
import { useGlobalStats } from '../../hooks/useQueries';
import clsx from 'clsx';

// ============================================
// Navigation Items
// ============================================
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number | string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'incidents',
    label: 'インシデント',
    icon: AlertTriangle,
    path: '/incidents',
    badge: 12,
    badgeColor: 'bg-status-critical',
  },
  {
    id: 'resources',
    label: 'リソース管理',
    icon: Package,
    path: '/resources',
  },
  {
    id: 'teams',
    label: '対応チーム',
    icon: Users,
    path: '/teams',
    badge: '3 派遣中',
    badgeColor: 'bg-kokoro-info',
  },
  {
    id: 'map',
    label: 'マップ',
    icon: Map,
    path: '/map',
  },
  {
    id: 'shelters',
    label: '避難所',
    icon: Building2,
    path: '/shelters',
    badge: 8,
    badgeColor: 'bg-kokoro-success',
  },
  {
    id: 'reports',
    label: 'レポート',
    icon: FileText,
    path: '/reports',
  },
  {
    id: 'settings',
    label: '設定',
    icon: Settings,
    path: '/settings',
  },
];

// ============================================
// Nav Item Component
// ============================================
const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        clsx(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-kokoro-accent/10 text-kokoro-accent border-l-2 border-kokoro-accent'
            : 'text-kokoro-muted hover:text-white hover:bg-kokoro-border/50'
        )
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
      
      {item.badge && (
        <span
          className={clsx(
            'px-2 py-0.5 text-xs font-bold rounded-full text-white',
            item.badgeColor || 'bg-kokoro-border'
          )}
        >
          {item.badge}
        </span>
      )}
      
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );
};

// ============================================
// Quick Stats Component
// ============================================
const QuickStats: React.FC = () => {
  const { data: stats } = useGlobalStats();

  return (
    <div className="p-4 border-b border-kokoro-border">
      <h3 className="text-xs font-display font-semibold text-kokoro-muted mb-3 tracking-wider">
        クイックステータス
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-4 h-4 text-status-critical" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className="text-2xl font-display font-bold text-status-critical">
            {stats?.active_incidents ?? 0}
          </div>
          <div className="text-xs text-kokoro-muted mt-1">アクティブ</div>
        </div>
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4 text-kokoro-info" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className="text-2xl font-display font-bold text-kokoro-info">
            {stats?.deployed_resources ?? 0}
          </div>
          <div className="text-xs text-kokoro-muted mt-1">派遣中</div>
        </div>
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-4 h-4 text-kokoro-warning" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className="text-2xl font-display font-bold text-kokoro-warning">
            {(stats?.sheltered_population ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-kokoro-muted mt-1">避難者数</div>
        </div>
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-4 h-4 text-kokoro-success" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className="text-2xl font-display font-bold text-kokoro-success">
            {(stats?.total_resources ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-kokoro-muted mt-1">リソース</div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Sidebar Component
// ============================================
interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-64 bg-kokoro-panel border-r border-kokoro-border flex flex-col shrink-0">
      {/* Quick Stats */}
      <QuickStats />

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* External Portals Quick Links */}
        <div className="mb-6 space-y-2">
          <h3 className="text-[10px] font-display font-semibold text-kokoro-muted mb-2 tracking-wider px-1">
            外部ポータル
          </h3>
          <a
            href={`${import.meta.env.VITE_SERVICENOW_INSTANCE_URL || 'https://dev269536.service-now.com'}/sp?id=kokoro_main`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-kokoro-darker hover:bg-kokoro-accent/10 border border-kokoro-border hover:border-kokoro-accent/50 rounded-lg text-kokoro-muted hover:text-kokoro-accent transition-all group"
          >
            <span className="text-xs font-medium">利用者ポータル (Main)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
          <a
            href={`${import.meta.env.VITE_SERVICENOW_INSTANCE_URL || 'https://dev269536.service-now.com'}/sp?id=kokoro_volunteer`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-kokoro-darker hover:bg-kokoro-info/10 border border-kokoro-border hover:border-kokoro-info/50 rounded-lg text-kokoro-muted hover:text-kokoro-info transition-all group"
          >
            <span className="text-xs font-medium">運用ポータル (CAD)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.id} item={item} />
          ))}
        </div>
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-kokoro-border">
        <div className="flex items-center gap-3 p-3 bg-kokoro-darker rounded-lg">
          <div className="w-8 h-8 rounded-full bg-kokoro-accent/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-kokoro-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">管理者</p>
            <p className="text-xs text-kokoro-muted truncate">admin@kokoro.jp</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
