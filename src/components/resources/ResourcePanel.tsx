// ============================================
// KOKORO EOC - Resource Panel (Kokoro Inventory)
// ============================================
// 使用 x_1821654_kokoro_0_kokoro_inventory 表

import React, { useState, useMemo } from 'react';
import {
  Package,
  Heart,
  Droplets,
  Utensils,
  Shirt,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Filter,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { serviceNowAPI } from '../../services/servicenow';
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

// ============================================
// Custom Hook for Inventory Data
// ============================================
function useKokoroInventory() {
  return useQuery({
    queryKey: ['kokoro-inventory'],
    queryFn: async () => {
      const response = await serviceNowAPI.getTable<any>(
        'x_1821654_kokoro_0_kokoro_inventory',
        { limit: 100 }
      );
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch inventory');
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5分間
    refetchInterval: 1000 * 60, // 1分ごと
  });
}

// ============================================
// UI Helpers
// ============================================
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

const getTypeFromName = (name: string, category?: string): InventoryItem['type'] => {
  const text = `${name} ${category || ''}`.toLowerCase();
  if (text.includes('水') || text.includes('water') || text.includes('飲料')) return 'water';
  if (text.includes('食') || text.includes('food') || text.includes('米') || text.includes('パン')) return 'food';
  if (text.includes('医') || text.includes('薬') || text.includes('medical') || text.includes('救急')) return 'medical';
  if (text.includes('衣') || text.includes('cloth') || text.includes('毛布') || text.includes('寝袋')) return 'clothing';
  if (text.includes('衛') || text.includes('sanitary') || text.includes('トイレ')) return 'sanitary';
  return 'other';
};

// ============================================
// Inventory Card Component
// ============================================
const InventoryCard: React.FC<{ item: InventoryItem }> = ({ item }) => {
  const TypeIcon = getTypeIcon(item.type);
  
  // 计算库存健康度
  const maxQty = item.max_capacity || item.warning_threshold * 5 || 100;
  const currentQty = item.current_quantity || item.stock_quantity;
  const healthPercent = Math.min(100, Math.round((currentQty / maxQty) * 100));

  return (
    <div className="p-3 border-b border-kokoro-border transition-all duration-200 hover:bg-kokoro-border/30">
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          item.status === 'safe' ? 'bg-kokoro-success/10 text-kokoro-success' : 
          item.status === 'warning' ? 'bg-kokoro-warning/10 text-kokoro-warning' : 
          'bg-status-critical/10 text-status-critical animate-pulse'
        )}>
          <TypeIcon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-white truncate">{item.item_name}</h4>
            <span className={clsx(
              'px-2 py-0.5 text-[10px] font-medium rounded-full flex items-center gap-1 shrink-0',
              item.status === 'safe' ? 'bg-kokoro-success/20 text-kokoro-success' : 
              item.status === 'warning' ? 'bg-kokoro-warning/20 text-kokoro-warning' : 
              'bg-status-critical/20 text-status-critical'
            )}>
              {item.status === 'safe' && <CheckCircle className="w-3 h-3" />}
              {item.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {item.status === 'depleted' && <Activity className="w-3 h-3" />}
              {item.status === 'safe' ? '適正' : item.status === 'warning' ? '要補充' : '枯渇'}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-kokoro-darker rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-500",
                  item.status === 'safe' ? 'bg-kokoro-success' : 
                  item.status === 'warning' ? 'bg-kokoro-warning' : 'bg-status-critical'
                )}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <span className={clsx(
              "text-xs font-mono w-16 text-right",
              item.status === 'safe' ? 'text-kokoro-muted' : 
              item.status === 'warning' ? 'text-kokoro-warning' : 'text-status-critical font-bold'
            )}>
              {currentQty} / {maxQty}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-kokoro-muted">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{item.location}</span>
              </span>
            )}
            {item.category && (
              <span className="px-1.5 py-0.5 bg-kokoro-darker rounded text-kokoro-muted">
                {item.category}
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
// Main Panel Component
// ============================================
const ResourcePanel: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const { data: rawInventory, isLoading, refetch } = useKokoroInventory();

  // 格式化库存数据
  const formattedInventory = useMemo<InventoryItem[]>(() => {
    if (!rawInventory) return [];
    
    return rawInventory.map((inv: any) => {
      const itemName = typeof inv.item_name === 'object' 
        ? inv.item_name?.display_value 
        : (inv.item_name || '不明な物資');
      
      const stockQty = parseInt(inv.stock_quantity || '0', 10);
      const currentQty = parseInt(inv.current_quantity || inv.stock_quantity || '0', 10);
      const threshold = parseInt(inv.warning_threshold || '0', 10);
      const maxCapacity = parseInt(inv.max_capacity || '0', 10);
      
      const locationName = typeof inv.location === 'object'
        ? inv.location?.display_value
        : (inv.location || '');

      const category = typeof inv.category === 'object'
        ? inv.category?.display_value
        : (inv.category || '');

      // 状态判定
      let status: InventoryItem['status'] = 'safe';
      if (currentQty <= 0) status = 'depleted';
      else if (currentQty <= threshold) status = 'warning';

      // 类别判定
      const type = getTypeFromName(itemName, category);

      return {
        sys_id: inv.sys_id,
        item_name: itemName,
        item_code: inv.item_code,
        category,
        stock_quantity: stockQty,
        current_quantity: currentQty,
        max_capacity: maxCapacity || undefined,
        warning_threshold: threshold,
        location: locationName,
        status,
        type,
      };
    }).sort((a, b) => {
      // 枯竭 > 警告 > 安全
      const score = { depleted: 3, warning: 2, safe: 1 };
      return score[b.status] - score[a.status];
    });
  }, [rawInventory]);

  // 统计
  const stats = useMemo(() => {
    const safe = formattedInventory.filter(i => i.status === 'safe').length;
    const warning = formattedInventory.filter(i => i.status === 'warning').length;
    const depleted = formattedInventory.filter(i => i.status === 'depleted').length;
    return { total: formattedInventory.length, safe, warning, depleted };
  }, [formattedInventory]);

  // 类别过滤
  const filteredInventory = selectedType 
    ? formattedInventory.filter(inv => inv.type === selectedType) 
    : formattedInventory;

  const typeFilters = [
    { type: 'water', icon: Droplets, label: '飲料水' },
    { type: 'food', icon: Utensils, label: '食料' },
    { type: 'medical', icon: Heart, label: '医療品' },
    { type: 'clothing', icon: Shirt, label: '衣類' },
  ];

  return (
    <div className="panel flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-kokoro-accent" />
          <span className="panel-title">広域リソース統括</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => refetch()}
            className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1"
            disabled={isLoading}
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="panel-content space-y-3">
        {/* 状态概览 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-kokoro-darker rounded-lg border border-kokoro-border/50">
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-kokoro-success">{stats.safe}</p>
              <p className="text-[9px] text-kokoro-muted">適正</p>
            </div>
            <div className="w-px h-8 bg-kokoro-border" />
            <div className="text-center">
              <p className="text-lg font-display font-bold text-kokoro-warning">{stats.warning}</p>
              <p className="text-[9px] text-kokoro-muted">要補充</p>
            </div>
            <div className="w-px h-8 bg-kokoro-border" />
            <div className="text-center">
              <p className="text-lg font-display font-bold text-status-critical">{stats.depleted}</p>
              <p className="text-[9px] text-kokoro-muted">枯渇</p>
            </div>
          </div>
        </div>

        {/* 类别过滤器 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {typeFilters.map(({ type, icon: Icon, label }) => (
            <button 
              key={type} 
              onClick={() => setSelectedType(selectedType === type ? null : type)} 
              className={clsx(
                'px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0', 
                selectedType === type 
                  ? 'bg-kokoro-accent text-kokoro-dark' 
                  : 'bg-kokoro-darker text-kokoro-muted hover:text-white'
              )} 
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 库存列表 */}
      <div className="flex-1 overflow-y-auto border-t border-kokoro-border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20" />)}
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-8 text-center text-kokoro-muted">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">在庫データが見つかりません</p>
            <p className="text-xs mt-1">kokoro_inventory テーブルにデータを追加してください</p>
          </div>
        ) : (
          filteredInventory.map(item => (
            <InventoryCard key={item.sys_id} item={item} />
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-kokoro-border flex items-center justify-between">
        <span className="text-xs text-kokoro-muted">
          在庫品目: {filteredInventory.length}
        </span>
        <button className="text-[10px] text-kokoro-accent hover:underline flex items-center gap-1">
          全域インベントリ詳細
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ResourcePanel;
