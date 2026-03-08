// ============================================
// KOKORO EOC - Global State Management (Zustand)
// ============================================
// 这是解决"意大利面条代码"问题的核心
// 所有面板共享数据，实现跨组件通信

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  MapViewport,
  ServiceNowIncident,
  ServiceNowResource,
  Notification,
  DashboardStats,
  FilterOptions,
  AICopilotMessage,
  AISuggestion,
} from '../types';

// ============================================
// 主应用状态 Store
// ============================================
interface AppStore {
  // UI 状态
  isLoading: boolean;
  sidebarOpen: boolean;
  activePanels: string[];
  theme: 'dark' | 'light';
  
  // 选中项
  selectedIncidentId: string | null;
  selectedResourceId: string | null;
  selectedMarkerId: string | null;
  
  // 筛选器
  incidentFilters: FilterOptions;
  resourceFilters: FilterOptions;
  
  // Actions
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  togglePanel: (panelId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  selectIncident: (id: string | null) => void;
  selectResource: (id: string | null) => void;
  selectMarker: (id: string | null) => void;
  setIncidentFilters: (filters: FilterOptions) => void;
  setResourceFilters: (filters: FilterOptions) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      isLoading: false,
      sidebarOpen: true,
      activePanels: ['incidents', 'weather', 'resources'],
      theme: 'dark',
      selectedIncidentId: null,
      selectedResourceId: null,
      selectedMarkerId: null,
      incidentFilters: {},
      resourceFilters: {},
      
      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      togglePanel: (panelId) => set((state) => ({
        activePanels: state.activePanels.includes(panelId)
          ? state.activePanels.filter((id) => id !== panelId)
          : [...state.activePanels, panelId],
      })),
      
      setTheme: (theme) => set({ theme }),
      
      selectIncident: (id) => set({ 
        selectedIncidentId: id,
        // 同步选中地图标记
        selectedMarkerId: id ? `incident-${id}` : null,
      }),
      
      selectResource: (id) => set({ 
        selectedResourceId: id,
        selectedMarkerId: id ? `resource-${id}` : null,
      }),
      
      selectMarker: (id) => set((state) => {
        // 解析 marker ID，自动选中对应的 incident/resource
        if (id?.startsWith('incident-')) {
          return { 
            selectedMarkerId: id,
            selectedIncidentId: id.replace('incident-', ''),
          };
        }
        if (id?.startsWith('resource-')) {
          return {
            selectedMarkerId: id,
            selectedResourceId: id.replace('resource-', ''),
          };
        }
        return { selectedMarkerId: id };
      }),
      
      setIncidentFilters: (filters) => set({ incidentFilters: filters }),
      setResourceFilters: (filters) => set({ resourceFilters: filters }),
      resetFilters: () => set({ incidentFilters: {}, resourceFilters: {} }),
    })),
    { name: 'kokoro-app-store' }
  )
);

// ============================================
// 地图状态 Store
// ============================================
interface MapStore {
  viewport: MapViewport;
  mapStyle: string;
  layers: {
    incidents: boolean;
    resources: boolean;
    shelters: boolean;
    heatmap: boolean;
    traffic: boolean;
    satellite: boolean;
  };
  
  // Actions
  setViewport: (viewport: Partial<MapViewport>) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setMapStyle: (style: string) => void;
  toggleLayer: (layerName: keyof MapStore['layers']) => void;
  resetView: () => void;
}

const DEFAULT_VIEWPORT: MapViewport = {
  latitude: 35.6762,  // 東京
  longitude: 139.6503,
  zoom: 10,
  bearing: 0,
  pitch: 45,
};

export const useMapStore = create<MapStore>()(
  devtools(
    (set) => ({
      viewport: DEFAULT_VIEWPORT,
      mapStyle: 'mapbox://styles/mapbox/dark-v11',
      layers: {
        incidents: true,
        resources: true,
        shelters: true,
        heatmap: false,
        traffic: false,
        satellite: false,
      },
      
      setViewport: (viewport) => set((state) => ({
        viewport: { ...state.viewport, ...viewport },
      })),
      
      flyTo: (latitude, longitude, zoom = 14) => set({
        viewport: {
          ...DEFAULT_VIEWPORT,
          latitude,
          longitude,
          zoom,
        },
      }),
      
      setMapStyle: (mapStyle) => set({ mapStyle }),
      
      toggleLayer: (layerName) => set((state) => ({
        layers: {
          ...state.layers,
          [layerName]: !state.layers[layerName],
        },
      })),
      
      resetView: () => set({ viewport: DEFAULT_VIEWPORT }),
    }),
    { name: 'kokoro-map-store' }
  )
);

// ============================================
// 通知状态 Store
// ============================================
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // 最多保留100条
          unreadCount: state.unreadCount + 1,
        }));
      },
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.read)
          ? state.unreadCount - 1
          : state.unreadCount,
      })),
      
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'kokoro-notification-store' }
  )
);

// ============================================
// AI Copilot 状态 Store
// ============================================
interface AICopilotStore {
  isOpen: boolean;
  messages: AICopilotMessage[];
  suggestions: AISuggestion[];
  isProcessing: boolean;
  
  toggleCopilot: () => void;
  addMessage: (message: Omit<AICopilotMessage, 'id' | 'timestamp'>) => void;
  addSuggestion: (suggestion: Omit<AISuggestion, 'id' | 'timestamp'>) => void;
  removeSuggestion: (id: string) => void;
  clearMessages: () => void;
  setProcessing: (processing: boolean) => void;
}

export const useAICopilotStore = create<AICopilotStore>()(
  devtools(
    (set) => ({
      isOpen: false,
      messages: [],
      suggestions: [],
      isProcessing: false,
      
      toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),
      
      addMessage: (message) => {
        const newMessage: AICopilotMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },
      
      addSuggestion: (suggestion) => {
        const newSuggestion: AISuggestion = {
          ...suggestion,
          id: `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          suggestions: [newSuggestion, ...state.suggestions].slice(0, 10),
        }));
      },
      
      removeSuggestion: (id) => set((state) => ({
        suggestions: state.suggestions.filter((s) => s.id !== id),
      })),
      
      clearMessages: () => set({ messages: [] }),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
    }),
    { name: 'kokoro-ai-copilot-store' }
  )
);

// ============================================
// Dashboard 统计数据 Store
// ============================================
interface StatsStore {
  stats: DashboardStats;
  lastUpdated: number | null;
  
  updateStats: (stats: Partial<DashboardStats>) => void;
  setStats: (stats: DashboardStats) => void;
}

const DEFAULT_STATS: DashboardStats = {
  total_incidents: 0,
  active_incidents: 0,
  critical_incidents: 0,
  resolved_today: 0,
  total_resources: 0,
  deployed_resources: 0,
  available_resources: 0,
  total_personnel: 0,
  active_personnel: 0,
  affected_population: 0,
  evacuated_population: 0,
  sheltered_population: 0,
  response_time_avg: 0,
  resolution_time_avg: 0,
};

export const useStatsStore = create<StatsStore>()(
  devtools(
    (set) => ({
      stats: DEFAULT_STATS,
      lastUpdated: null,
      
      updateStats: (partialStats) => set((state) => ({
        stats: { ...state.stats, ...partialStats },
        lastUpdated: Date.now(),
      })),
      
      setStats: (stats) => set({
        stats,
        lastUpdated: Date.now(),
      }),
    }),
    { name: 'kokoro-stats-store' }
  )
);
