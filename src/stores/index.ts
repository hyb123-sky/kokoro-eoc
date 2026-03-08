// ============================================
// KOKORO EOC - Zustand Stores
// ============================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// ============================================
// App Store
// ============================================
interface AppState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  language: 'ja' | 'en';
  selectedIncidentId: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (language: 'ja' | 'en') => void;
  selectIncident: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'dark',
        language: 'ja',
        selectedIncidentId: null,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        selectIncident: (id) => set({ selectedIncidentId: id }),
      }),
      { name: 'kokoro-app-store' }
    )
  )
);

// ============================================
// Map Store
// ============================================
interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  viewport: { latitude: number; longitude: number; zoom: number };
  selectedMarkerId: string | null;
  visibleLayers: string[];
  layers: {
    incidents: boolean;
    shelters: boolean;
    resources: boolean;
    earthquakes: boolean;
  };
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  setViewport: (viewport: { latitude: number; longitude: number; zoom: number }) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  selectMarker: (id: string | null) => void;
  toggleLayer: (layerId: string) => void;
}

export const useMapStore = create<MapState>()(
  devtools((set) => ({
    center: { lat: 35.6762, lng: 139.6503 },
    zoom: 10,
    viewport: { latitude: 35.6762, longitude: 139.6503, zoom: 10 },
    selectedMarkerId: null,
    visibleLayers: ['incidents', 'shelters', 'resources'],
    layers: {
      incidents: true,
      shelters: true,
      resources: true,
      earthquakes: true,
    },
    setCenter: (center) => set({ center }),
    setZoom: (zoom) => set({ zoom }),
    setViewport: (viewport) => set({ viewport }),
    flyTo: (lat, lng, zoom = 14) => set({ 
      center: { lat, lng }, 
      zoom,
      viewport: { latitude: lat, longitude: lng, zoom }
    }),
    selectMarker: (id) => set({ selectedMarkerId: id }),
    toggleLayer: (layerId) =>
      set((state) => ({
        visibleLayers: state.visibleLayers.includes(layerId)
          ? state.visibleLayers.filter((l) => l !== layerId)
          : [...state.visibleLayers, layerId],
        layers: {
          ...state.layers,
          [layerId]: !state.layers[layerId as keyof typeof state.layers],
        },
      })),
  }))
);

// ============================================
// Notification Store
// ============================================
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set) => ({
    notifications: [],
    unreadCount: 0,
    addNotification: (notification) =>
      set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date(),
          read: false,
        };
        return {
          notifications: [newNotification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        };
      }),
    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),
    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),
    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.read)
          ? state.unreadCount - 1
          : state.unreadCount,
      })),
    clearAll: () => set({ notifications: [], unreadCount: 0 }),
  }))
);

// ============================================
// AI Copilot Store
// ============================================
interface AICopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICopilotState {
  isOpen: boolean;
  messages: AICopilotMessage[];
  isLoading: boolean;
  isProcessing: boolean;
  toggleCopilot: () => void;
  setOpen: (open: boolean) => void;
  addMessage: (message: Omit<AICopilotMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  clearMessages: () => void;
}

export const useAICopilotStore = create<AICopilotState>()(
  devtools((set) => ({
    isOpen: false,
    messages: [],
    isLoading: false,
    isProcessing: false,
    toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),
    setOpen: (open) => set({ isOpen: open }),
    addMessage: (message) =>
      set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
          },
        ],
      })),
    setLoading: (loading) => set({ isLoading: loading }),
    setProcessing: (processing) => set({ isProcessing: processing }),
    clearMessages: () => set({ messages: [] }),
  }))
);

// ============================================
// Stats Store
// ============================================
interface StatsState {
  activeIncidents: number;
  criticalIncidents: number;
  resolvedToday: number;
  averageResponseTime: number;
  deployedVolunteers: number;
  totalShelterCapacity: number;
  currentOccupancy: number;
  updateStats: (stats: Partial<StatsState>) => void;
}

export const useStatsStore = create<StatsState>()(
  devtools((set) => ({
    activeIncidents: 0,
    criticalIncidents: 0,
    resolvedToday: 0,
    averageResponseTime: 0,
    deployedVolunteers: 0,
    totalShelterCapacity: 0,
    currentOccupancy: 0,
    updateStats: (stats) => set((state) => ({ ...state, ...stats })),
  }))
);
