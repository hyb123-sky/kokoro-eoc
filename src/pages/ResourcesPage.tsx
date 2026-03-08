// ============================================
// KOKORO EOC - Resources Page
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Package,
  Users,
  Heart,
  Droplets,
  Utensils,
  Shirt,
  RefreshCw,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { serviceNowAPI } from '../services/servicenow';
import clsx from 'clsx';

// ============================================
// Types
// ============================================
interface InventoryItem {
  sys_id: string;
  item_name: string;
  item_code?: string;
  category?: string;
  stock_quantity: number;
  current_quantity?: number;
  max_capacity?: number;
  warning_threshold: number;
  location?: string;
  status: 'safe' | 'warning' | 'depleted';
  type: 'water' | 'food' | 'medical' | 'clothing' | 'sanitary' | 'other';
}

interface Volunteer {
  sys_id: string;
  name: string;
  skills?: string;
  status: 'available' | 'deployed' | 'off_duty';
  location?: string;
  phone?: string;
  assignment?: string;
}

// ============================================
// Custom Hooks
// ============================================
function useKokoroInventory() {
  return useQuery({
    queryKey: ['kokoro-inventory'],
    queryFn: async () => {
      const response = await serviceNowAPI.getTable<Record<string, unknown>>(
        'x_1821654_kokoro_0_kokoro_inventory',
        { limit: 200 }
      );
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch inventory');
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60,
  });
}

function useKokoroVolunteers() {
  return useQuery({
    queryKey: ['kokoro-volunteers'],
    queryFn: async () => {
      const response = await serviceNowAPI.getTable<Record<string, unknown>>(
        'x_1821654_kokoro_0_kokoro_volunteer',
        { limit: 200 }
      );
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch volunteers');
      }
      return response.data || [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

// ============================================
// Helper Functions
// ============================================
const getTypeFromName = (name: string, category?: string): InventoryItem['type'] => {
  const text = `${name} ${category || ''}`.toLowerCase();
  if (text.includes('水') || text.includes('water') || text.includes('飲料')) return 'water';
  if (text.includes('食') || text.includes('food') || text.includes('米') || text.includes('パン')) return 'food';
  if (text.includes('医') || text.includes('薬') || text.includes('medical') || text.includes('救急')) return 'medical';
  if (text.includes('衣') || text.includes('cloth') || text.includes('毛布') || text.includes('寝袋')) return 'clothing';
  if (text.includes('衛') || text.includes('sanitary') || text.includes('トイレ')) return 'sanitary';
  return 'other';
};

const getTypeIcon = (type: InventoryItem['type']) => {
  const icons = {
    water: Droplets,
    food: Utensils,
    medical: Heart,
    clothing: Shirt,
    sanitary: Package,
    other: Package,
  };
  return icons[type] || Package;
};

// ============================================
// Inventory Card Component
// ============================================
const InventoryCard: React.FC<{ item: InventoryItem }> = ({ item }) => {
  const TypeIcon = getTypeIcon(item.type);
  const maxQty = item.max_capacity || item.warning_threshold * 5 || 100;
  const currentQty = item.current_quantity || item.stock_quantity;
  const healthPercent = Math.min(100, Math.round((currentQty / maxQty) * 100));

  return (
    <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border hover:border-kokoro-accent/50 transition-all">
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
          item.status === 'safe' ? 'bg-kokoro-success/10 text-kokoro-success' : 
          item.status === 'warning' ? 'bg-kokoro-warning/10 text-kokoro-warning' : 
          'bg-status-critical/10 text-status-critical animate-pulse'
        )}>
          <TypeIcon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate">{item.item_name}</h4>
            <span className={clsx(
              'px-2 py-0.5 text-[10px] font-medium rounded-full flex items-center gap-1 shrink-0',
              item.status === 'safe' ? 'bg-kokoro-success/20 text-kokoro-success' : 
              item.status === 'warning' ? 'bg-kokoro-warning/20 text-kokoro-warning' : 
              'bg-status-critical/20 text-status-critical'
            )}>
              {item.status === 'safe' && <CheckCircle className="w-3 h-3" />}
              {item.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {item.status === 'safe' ? '適正' : item.status === 'warning' ? '要補充' : '枯渇'}
            </span>
          </div>

          {item.item_code && (
            <p className="text-xs text-kokoro-muted font-mono mb-2">{item.item_code}</p>
          )}

          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 bg-kokoro-darker rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-500",
                  item.status === 'safe' ? 'bg-kokoro-success' : 
                  item.status === 'warning' ? 'bg-kokoro-warning' : 'bg-status-critical'
                )}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-kokoro-muted w-20 text-right">
              {currentQty} / {maxQty}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-kokoro-muted">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.location}
              </span>
            )}
            <span>閾値: {item.warning_threshold}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Volunteer Card Component
// ============================================
const VolunteerCard: React.FC<{ volunteer: Volunteer }> = ({ volunteer }) => {
  const statusConfig = {
    available: { label: '待機中', className: 'bg-kokoro-success/20 text-kokoro-success' },
    deployed: { label: '派遣中', className: 'bg-kokoro-warning/20 text-kokoro-warning' },
    off_duty: { label: '休暇', className: 'bg-kokoro-muted/20 text-kokoro-muted' },
  };
  const status = statusConfig[volunteer.status] || statusConfig.available;

  return (
    <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border hover:border-kokoro-accent/50 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-kokoro-accent/20 flex items-center justify-center text-kokoro-accent font-bold">
          {volunteer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">{volunteer.name}</h4>
            <span className={clsx('px-2 py-0.5 text-[10px] font-medium rounded-full', status.className)}>
              {status.label}
            </span>
          </div>
          {volunteer.skills && (
            <p className="text-xs text-kokoro-muted mb-2">{volunteer.skills}</p>
          )}
          {volunteer.assignment && (
            <p className="text-xs text-kokoro-accent">📍 {volunteer.assignment}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Resources Page
// ============================================
const ResourcesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'volunteers'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const { data: rawInventory, isLoading: invLoading, refetch: refetchInv } = useKokoroInventory();
  const { data: rawVolunteers, isLoading: volLoading, refetch: refetchVol } = useKokoroVolunteers();

  // Transform inventory data
  const inventory = useMemo<InventoryItem[]>(() => {
    if (!rawInventory) return [];
    
    return rawInventory.map((inv: Record<string, unknown>) => {
      const itemNameRaw = inv.item_name as string | { display_value?: string } | undefined;
      const itemName = typeof itemNameRaw === 'object' && itemNameRaw !== null
        ? itemNameRaw.display_value || '不明な物資'
        : (itemNameRaw as string) || '不明な物資';
      
      const stockQty = parseInt(String(inv.stock_quantity || '0'), 10);
      const currentQty = parseInt(String(inv.current_quantity || inv.stock_quantity || '0'), 10);
      const threshold = parseInt(String(inv.warning_threshold || '0'), 10);
      const maxCapacity = parseInt(String(inv.max_capacity || '0'), 10);
      
      const locationRaw = inv.location as string | { display_value?: string } | undefined;
      const locationName = typeof locationRaw === 'object' && locationRaw !== null
        ? locationRaw.display_value || ''
        : (locationRaw as string) || '';

      const categoryRaw = inv.category as string | { display_value?: string } | undefined;
      const category = typeof categoryRaw === 'object' && categoryRaw !== null
        ? categoryRaw.display_value || ''
        : (categoryRaw as string) || '';

      let status: InventoryItem['status'] = 'safe';
      if (currentQty <= 0) status = 'depleted';
      else if (currentQty <= threshold) status = 'warning';

      return {
        sys_id: inv.sys_id as string,
        item_name: itemName,
        item_code: inv.item_code as string | undefined,
        category,
        stock_quantity: stockQty,
        current_quantity: currentQty,
        max_capacity: maxCapacity || undefined,
        warning_threshold: threshold,
        location: locationName,
        status,
        type: getTypeFromName(itemName, category),
      };
    }).sort((a, b) => {
      const score = { depleted: 3, warning: 2, safe: 1 };
      return score[b.status] - score[a.status];
    });
  }, [rawInventory]);

  // Transform volunteers data
  const volunteers = useMemo<Volunteer[]>(() => {
    if (!rawVolunteers) return [];
    return rawVolunteers.map((vol: Record<string, unknown>) => {
      const nameRaw = vol.name as string | { display_value?: string } | undefined;
      const name = typeof nameRaw === 'object' && nameRaw !== null
        ? nameRaw.display_value || '不明'
        : (nameRaw as string) || '不明';

      return {
        sys_id: vol.sys_id as string,
        name,
        skills: vol.skills as string | undefined,
        status: (vol.status as Volunteer['status']) || 'available',
        location: vol.location as string | undefined,
        phone: vol.phone as string | undefined,
        assignment: vol.current_assignment as string | undefined,
      };
    });
  }, [rawVolunteers]);

  // Stats
  const invStats = {
    total: inventory.length,
    safe: inventory.filter(i => i.status === 'safe').length,
    warning: inventory.filter(i => i.status === 'warning').length,
    depleted: inventory.filter(i => i.status === 'depleted').length,
  };

  const volStats = {
    total: volunteers.length,
    available: volunteers.filter(v => v.status === 'available').length,
    deployed: volunteers.filter(v => v.status === 'deployed').length,
    offDuty: volunteers.filter(v => v.status === 'off_duty').length,
  };

  // Filtered data
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (searchQuery && !item.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType && item.type !== filterType) return false;
      return true;
    });
  }, [inventory, searchQuery, filterType]);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(vol => {
      if (searchQuery && !vol.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [volunteers, searchQuery]);

  const isLoading = activeTab === 'inventory' ? invLoading : volLoading;
  const handleRefresh = () => activeTab === 'inventory' ? refetchInv() : refetchVol();

  const typeFilters = [
    { type: 'water', icon: Droplets, label: '飲料水' },
    { type: 'food', icon: Utensils, label: '食料' },
    { type: 'medical', icon: Heart, label: '医療品' },
    { type: 'clothing', icon: Shirt, label: '衣類' },
  ];

  return (
    <div className="h-full flex flex-col bg-kokoro-dark">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-kokoro-border bg-kokoro-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-kokoro-accent" />
            <h1 className="text-xl font-display font-bold text-white">リソース管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-kokoro-muted hover:text-kokoro-accent rounded-lg hover:bg-kokoro-darker"
            >
              <RefreshCw className={clsx('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80">
              <Plus className="w-4 h-4" />
              新規登録
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'inventory'
                ? 'bg-kokoro-accent text-kokoro-dark'
                : 'text-kokoro-muted hover:text-white hover:bg-kokoro-darker'
            )}
          >
            <Package className="w-4 h-4 inline mr-2" />
            物資在庫 ({invStats.total})
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'volunteers'
                ? 'bg-kokoro-accent text-kokoro-dark'
                : 'text-kokoro-muted hover:text-white hover:bg-kokoro-darker'
            )}
          >
            <Users className="w-4 h-4 inline mr-2" />
            ボランティア ({volStats.total})
          </button>
        </div>

        {/* Stats Row */}
        {activeTab === 'inventory' ? (
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-success" />
              <span className="text-sm text-kokoro-muted">適正: <span className="text-white font-bold">{invStats.safe}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-warning" />
              <span className="text-sm text-kokoro-muted">要補充: <span className="text-white font-bold">{invStats.warning}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-critical" />
              <span className="text-sm text-kokoro-muted">枯渇: <span className="text-white font-bold">{invStats.depleted}</span></span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-success" />
              <span className="text-sm text-kokoro-muted">待機中: <span className="text-white font-bold">{volStats.available}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-warning" />
              <span className="text-sm text-kokoro-muted">派遣中: <span className="text-white font-bold">{volStats.deployed}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-muted" />
              <span className="text-sm text-kokoro-muted">休暇: <span className="text-white font-bold">{volStats.offDuty}</span></span>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kokoro-muted" />
            <input
              type="text"
              placeholder={activeTab === 'inventory' ? '物資を検索...' : 'ボランティアを検索...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white placeholder-kokoro-muted focus:outline-none focus:border-kokoro-accent"
            />
          </div>

          {activeTab === 'inventory' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-kokoro-muted" />
              {typeFilters.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setFilterType(filterType === type ? null : type)}
                  className={clsx(
                    'px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5',
                    filterType === type
                      ? 'bg-kokoro-accent text-kokoro-dark'
                      : 'bg-kokoro-darker text-kokoro-muted hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-kokoro-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-kokoro-muted">読み込み中...</p>
          </div>
        ) : activeTab === 'inventory' ? (
          filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-kokoro-muted">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>在庫データが見つかりません</p>
              <p className="text-sm mt-2">kokoro_inventory テーブルにデータを追加してください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredInventory.map(item => (
                <InventoryCard key={item.sys_id} item={item} />
              ))}
            </div>
          )
        ) : (
          filteredVolunteers.length === 0 ? (
            <div className="text-center py-12 text-kokoro-muted">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ボランティアデータが見つかりません</p>
              <p className="text-sm mt-2">kokoro_volunteer テーブルにデータを追加してください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVolunteers.map(vol => (
                <VolunteerCard key={vol.sys_id} volunteer={vol} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
