// ============================================
// KOKORO EOC - Type Definitions
// ============================================

// [新增] 映射至 Silent Wish 表
export interface ServiceNowSilentWish {
  sys_id: string;
  number?: string;
  wish_content?: string;
  state: string;
  priority: string;
  latitude: string;
  longitude: string;
  // 新增字段
  sys_created_on?: string;
  sys_updated_on?: string;
  assigned_to?: { display_value?: string; value?: string };
  assignment_group?: { display_value?: string; value?: string };
  contact_info?: string;
  shelter_zone?: string;
  urgency?: string;
  affected_count?: string;
}

// ServiceNow 相关类型
export interface ServiceNowIncident {
  sys_id: string;
  number: string;
  short_description: string;
  description: string;
  priority: '1' | '2' | '3' | '4' | '5';
  state: string;
  category: string;
  location: any; // Reference 字段，指向 cmn_location
  assigned_to: string;
  assignment_group: string;
  opened_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

// 映射至 cmn_location 表
export interface ServiceNowLocation {
  sys_id: string;
  name: string;
  latitude: string;
  longitude: string;
  x_1821654_kokoro_0_eoc_site_type?: string; 
  x_1821654_kokoro_0_capacity?: string; 
  x_1821654_kokoro_0_current_occupancy?: string;
  x_1821654_kokoro_0_site_status?: string;
}

// 映射至 alm_asset 表
export interface ServiceNowResource {
  sys_id: string;
  display_name: string;
  install_status: string; 
  location: any; // Reference 字段，指向 cmn_location
  x_1821654_kokoro_0_eoc_category?: string; 
  x_1821654_kokoro_0_expiry_date?: string;
}

export interface ServiceNowTask {
  sys_id: string;
  number: string;
  short_description: string;
  state: 'pending' | 'work_in_progress' | 'complete' | 'cancelled';
  priority: '1' | '2' | '3' | '4' | '5';
  assigned_to: string;
  due_date: string;
  parent: string; // incident sys_id
}

// 地震 API 类型 (USGS / JMA)
export interface EarthquakeEvent {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    status: string;
    tsunami: number;
    sig: number;
    type: string;
    title: string;
    alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

export interface EarthquakeAPIResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeEvent[];
}

// 天气 API 类型
export interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  condition: string;
  icon: string;
  precipitation: number;
  uv_index: number;
  updated_at: string;
}

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  urgency: 'immediate' | 'expected' | 'future' | 'past' | 'unknown';
  areas: string[];
  effective: string;
  expires: string;
}

// 地図関連
export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapMarker {
  id: string;
  type: 'incident' | 'resource' | 'shelter' | 'hospital' | 'team' | 'checkpoint';
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}

// リアルタイムデータ (Firebase/Supabase 用)
export interface RealtimeVehicle {
  id: string;
  team_id: string;
  name: string;
  type: 'ambulance' | 'fire_truck' | 'rescue' | 'supply' | 'command';
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  status: 'en_route' | 'on_scene' | 'returning' | 'idle';
  last_updated: number;
}

export interface RealtimeSensor {
  id: string;
  type: 'seismic' | 'water_level' | 'weather' | 'radiation' | 'air_quality';
  latitude: number;
  longitude: number;
  value: number;
  unit: string;
  threshold_warning: number;
  threshold_critical: number;
  last_updated: number;
}

// AI Copilot 関連
export interface AICopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    action?: string;
    confidence?: number;
    sources?: string[];
  };
}

export interface AISuggestion {
  id: string;
  type: 'resource_allocation' | 'evacuation_route' | 'priority_change' | 'team_dispatch' | 'alert';
  title: string;
  description: string;
  confidence: number;
  action: () => void;
  timestamp: number;
}

// ダッシュボード統計
export interface DashboardStats {
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  resolved_today: number;
  
  total_resources: number;
  deployed_resources: number;
  available_resources: number;
  
  total_personnel: number;
  active_personnel: number;
  
  affected_population: number;
  evacuated_population: number;
  sheltered_population: number;
  
  response_time_avg: number; // minutes
  resolution_time_avg: number; // hours
}

// アプリケーション状態
export interface AppState {
  isLoading: boolean;
  error: string | null;
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  activePanels: string[];
  selectedIncident: string | null;
  selectedResource: string | null;
  mapViewport: MapViewport;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

// API レスポンス共通型
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// フィルター・ソート
export interface FilterOptions {
  status?: string[];
  priority?: string[];
  category?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: string;
  assignedTo?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// ServiceNow API 設定
export interface ServiceNowConfig {
  instanceUrl: string;
  apiVersion: string;
  tables: {
    incidents: string;
    tasks: string;
    resources: string;
    users: string;
    locations: string;
  };
}