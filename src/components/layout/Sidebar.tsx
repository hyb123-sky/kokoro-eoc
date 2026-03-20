// ============================================
// KOKORO EOC - Sidebar Component (with Routing)
// ============================================
// 修正点: QuickStats 从硬编码改为实际 API 数据

import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Loader2,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useQueries';
import clsx from 'clsx';

// ============================================
// Priority Mapper (与 IncidentPanel 保持一致)
// ============================================
const getPriorityLevel = (priority: string | number | undefined): string => {
  if (!priority) return '5';
  const p = String(priority).trim();
  switch (p) {
    case '1': return '1';
    case '2': return '3';
    case '3': return '5';
    default: break;
  }
  const num = parseInt(p);
  if (!isNaN(num)) {
    if (num <= 1) return '1';
    if (num <= 2) return '2';
    if (num <= 3) return '3';
    if (num <= 4) return '4';
    return '5';
  }
  if (p.includes('限界') || p.includes('今すぐ') || p.includes('High')) return '1';
  if (p.includes('普通') || p.includes('Medium')) return '3';
  if (p.includes('急ぎません') || p.includes('Low')) return '5';
  return '5';
};

// ============================================
// Navigation Items
// ============================================
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badgeKey?: string; // 用于动态 badge
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
    badgeKey: 'activeIncidents',
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
    badgeKey: 'shelterCount',
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
const NavItemComponent: React.FC<{ item: NavItem; badge?: number | string }> = ({ item, badge }) => {
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
      
      {badge !== undefined && badge !== 0 && (
        <span
          className={clsx(
            'px-2 py-0.5 text-xs font-bold rounded-full text-white',
            item.badgeColor || 'bg-kokoro-border'
          )}
        >
          {badge}
        </span>
      )}
      
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );
};

// ============================================
// Quick Stats Component (FIXED - 実データ使用)
// ============================================
const QuickStats: React.FC = () => {
  const { silentWishes, locations, inventories, isLoading } = useDashboardData();

  // 実データから計算
  const activeIncidents = silentWishes?.filter(
    w => !['完了', 'closed', '7'].includes(String(w.state || ''))
  ).length || 0;

  // 避難者数 = 全避難所の current_occupancy 合計
  const totalEvacuees = locations?.reduce((sum, loc) => {
    return sum + parseInt(loc.x_1821654_kokoro_0_current_occupancy || '0');
  }, 0) || 0;

  // 派遣中 = volunteers は表がないので、deployed 状態のものは 0
  // 代わりに「対応中」の工単数を表示
  const inProgressCount = silentWishes?.filter(
    w => ['2', '担当者決定', '配送中', 'work_in_progress'].includes(String(w.state || ''))
  ).length || 0;

  // リソース = インベントリの品目数
  const resourceCount = inventories?.length || 0;

  if (isLoading) {
    return (
      <div className="p-4 border-b border-kokoro-border">
        <h3 className="text-xs font-display font-semibold text-kokoro-muted mb-3 tracking-wider">
          クイックステータス
        </h3>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-kokoro-accent animate-spin" />
        </div>
      </div>
    );
  }

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
          <div className="text-2xl font-display font-bold text-status-critical">{activeIncidents}</div>
          <div className="text-xs text-kokoro-muted mt-1">アクティブ</div>
        </div>
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4 text-kokoro-info" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className="text-2xl font-display font-bold text-kokoro-info">{inProgressCount}</div>
          <div className="text-xs text-kokoro-muted mt-1">対応中</div>
        </div>
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-4 h-4 text-kokoro-warning" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className={clsx(
            'text-2xl font-display font-bold text-kokoro-warning',
            totalEvacuees >= 1000 && 'text-xl' // 大きい数字は少し小さく
          )}>
            {totalEvacuees.toLocaleString()}
          </div>
          <div className="text-xs text-kokoro-muted mt-1">避難者数</div>
        </div>
        <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-4 h-4 text-kokoro-success" />
            <Activity className="w-3 h-3 text-kokoro-muted" />
          </div>
          <div className="text-2xl font-display font-bold text-kokoro-success">{resourceCount}</div>
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
  const { silentWishes, locations } = useDashboardData();

  // 动态 badge 值
  const badgeValues: Record<string, number> = {
    activeIncidents: silentWishes?.filter(
      w => !['完了', 'closed', '7'].includes(String(w.state || ''))
    ).length || 0,
    shelterCount: locations?.filter(
      l => l.x_1821654_kokoro_0_site_status === 'open'
    ).length || 0,
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-64 bg-kokoro-panel border-r border-kokoro-border flex flex-col shrink-0">
      {/* Quick Stats */}
      <QuickStats />

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              badge={item.badgeKey ? badgeValues[item.badgeKey] : undefined}
            />
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
