// ============================================
// KOKORO EOC - Sidebar Component
// ============================================

import React from 'react';
import {
  AlertTriangle,
  Package,
  Users,
  Map,
  Cloud,
  BarChart3,
  FileText,
  Truck,
  Building2,
  Radio,
  Shield,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAppStore, useStatsStore } from '../../stores';
import clsx from 'clsx';

// ============================================
// Types
// ============================================
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  subItems?: { id: string; label: string }[];
}

// ============================================
// Navigation Items
// ============================================
const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: BarChart3,
  },
  {
    id: 'incidents',
    label: 'インシデント',
    icon: AlertTriangle,
    badge: 12,
    badgeColor: 'bg-status-critical',
  },
  {
    id: 'resources',
    label: 'リソース管理',
    icon: Package,
    subItems: [
      { id: 'vehicles', label: '車両' },
      { id: 'equipment', label: '機材' },
      { id: 'supplies', label: '物資' },
    ],
  },
  {
    id: 'teams',
    label: '対応チーム',
    icon: Users,
    badge: '3 派遣中',
    badgeColor: 'bg-kokoro-info',
  },
  {
    id: 'map',
    label: 'マップ',
    icon: Map,
  },
  {
    id: 'weather',
    label: '気象情報',
    icon: Cloud,
  },
  {
    id: 'shelters',
    label: '避難所',
    icon: Building2,
    badge: 8,
    badgeColor: 'bg-kokoro-success',
  },
  {
    id: 'logistics',
    label: '物流',
    icon: Truck,
  },
  {
    id: 'communications',
    label: '通信',
    icon: Radio,
  },
  {
    id: 'reports',
    label: 'レポート',
    icon: FileText,
  },
];

// ============================================
// Stat Card Component
// ============================================
const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}> = ({ label, value, icon: Icon, color = 'text-kokoro-accent' }) => (
  <div className="p-3 bg-kokoro-darker rounded-lg border border-kokoro-border">
    <div className="flex items-center justify-between mb-2">
      <Icon className={clsx('w-4 h-4', color)} />
      <Zap className="w-3 h-3 text-kokoro-muted" />
    </div>
    <div className={clsx('text-2xl font-display font-bold', color)}>{value}</div>
    <div className="text-xs text-kokoro-muted mt-1">{label}</div>
  </div>
);

// ============================================
// Nav Item Component
// ============================================
const NavItemComponent: React.FC<{
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onToggleExpand?: () => void;
}> = ({ item, isActive, isExpanded, onClick, onToggleExpand }) => {
  const Icon = item.icon;

  return (
    <div>
      <button
        onClick={item.subItems ? onToggleExpand : onClick}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-kokoro-accent/10 text-kokoro-accent border-l-2 border-kokoro-accent'
            : 'text-kokoro-muted hover:text-white hover:bg-kokoro-border/50'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
        
        {item.badge && (
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-bold rounded-full',
              item.badgeColor || 'bg-kokoro-border',
              typeof item.badge === 'number' ? 'text-white' : 'text-white'
            )}
          >
            {item.badge}
          </span>
        )}
        
        {item.subItems && (
          <ChevronRight
            className={clsx(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
          />
        )}
      </button>

      {/* Sub Items */}
      {item.subItems && isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {item.subItems.map((subItem) => (
            <button
              key={subItem.id}
              onClick={onClick}
              className="w-full text-left px-3 py-2 text-sm text-kokoro-muted hover:text-white hover:bg-kokoro-border/30 rounded-lg transition-colors"
            >
              {subItem.label}
            </button>
          ))}
        </div>
      )}
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
  const [activeItem, setActiveItem] = React.useState('dashboard');
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const { stats } = useStatsStore();

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-64 bg-kokoro-panel border-r border-kokoro-border flex flex-col shrink-0">
      {/* Quick Stats */}
      <div className="p-4 border-b border-kokoro-border">
        <h3 className="text-xs font-display font-semibold text-kokoro-muted mb-3 tracking-wider">
          クイックステータス
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="アクティブ"
            value={stats.active_incidents}
            icon={AlertTriangle}
            color="text-status-critical"
          />
          <StatCard
            label="対応中"
            value={stats.deployed_resources}
            icon={Truck}
            color="text-kokoro-info"
          />
          <StatCard
            label="避難者"
            value={stats.evacuated_population.toLocaleString()}
            icon={Users}
            color="text-kokoro-warning"
          />
          <StatCard
            label="リソース"
            value={stats.available_resources}
            icon={Package}
            color="text-kokoro-success"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              isExpanded={expandedItems.includes(item.id)}
              onClick={() => setActiveItem(item.id)}
              onToggleExpand={() => toggleExpand(item.id)}
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
