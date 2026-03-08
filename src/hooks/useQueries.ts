// ============================================
// KOKORO EOC - TanStack Query Hooks
// ============================================
// 解决数据缓存问题
// "不要每次切换 Tab 都重新请求地震数据，缓存 1 分钟"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceNowAPI } from '../services/servicenow';
import { externalAPI } from '../services/external-api';
import type {
  ServiceNowIncident,
  ServiceNowResource,
  ServiceNowTask,
  ServiceNowLocation,
  ServiceNowSilentWish, // [新增]
  FilterOptions,
  EarthquakeEvent,
  WeatherData,
} from '../types';

// ============================================
// Query Keys - 统一管理
// ============================================
export const queryKeys = {
  // ServiceNow
  incidents: (filters?: FilterOptions) => ['incidents', filters] as const,
  incident: (id: string) => ['incident', id] as const,
  resources: (filters?: FilterOptions) => ['resources', filters] as const,
  resource: (id: string) => ['resource', id] as const,
  locations: () => ['locations'] as const, // [新增] 避难所坐标数据键值
  tasks: (incidentId: string) => ['tasks', incidentId] as const,
  stats: () => ['stats'] as const,
  
  // External APIs
  earthquakes: (params?: { timeRange: string; minMagnitude: string }) => 
    ['earthquakes', params] as const,
  weather: (lat: number, lng: number) => ['weather', lat, lng] as const,
  forecast: (lat: number, lng: number) => ['forecast', lat, lng] as const,
  warnings: (areaCode?: string) => ['warnings', areaCode] as const,
};

// ============================================
// ServiceNow Hooks
// ============================================

/**
 * インシデント一覧を取得
 * - 自動リフレッシュ: 30秒
 * - キャッシュ: 5分
 */
export function useIncidents(filters: FilterOptions = {}) {
  return useQuery({
    queryKey: queryKeys.incidents(filters),
    queryFn: async () => {
      const response = await serviceNowAPI.getIncidents(filters);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch incidents');
      }
      return response.data!;
    },
    staleTime: 1000 * 60 * 5, // 5分間は新鮮とみなす
    refetchInterval: 1000 * 30, // 30秒ごとに自動リフレッシュ
    refetchOnWindowFocus: true,
  });
}

/**
 * 単一インシデントを取得
 */
export function useIncident(id: string | null) {
  return useQuery({
    queryKey: queryKeys.incident(id!),
    queryFn: async () => {
      const response = await serviceNowAPI.getIncidentById(id!);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch incident');
      }
      return response.data!;
    },
    enabled: !!id, // id がある場合のみ実行
    staleTime: 1000 * 60 * 2, // 2分
  });
}

/**
 * インシデント作成
 */
export function useCreateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ServiceNowIncident>) => {
      const response = await serviceNowAPI.createIncident(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create incident');
      }
      return response.data!;
    },
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

/**
 * インシデント更新
 */
export function useUpdateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceNowIncident> }) => {
      const response = await serviceNowAPI.updateIncident(id, data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update incident');
      }
      return response.data!;
    },
    onSuccess: (data, variables) => {
      // 特定のインシデントキャッシュを更新
      queryClient.setQueryData(queryKeys.incident(variables.id), data);
      // リストを無効化
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

/**
 * リソース一覧を取得
 */
export function useResources(filters: FilterOptions = {}) {
  return useQuery({
    queryKey: queryKeys.resources(filters),
    queryFn: async () => {
      const response = await serviceNowAPI.getResources(filters);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch resources');
      }
      return response.data!;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60, // 1分ごと
  });
}

/**
 * ロケーション（避難所・施設）一覧を取得
 */
export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations(),
    queryFn: async () => {
      const response = await serviceNowAPI.getLocations();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch locations');
      }
      return response.data!;
    },
    staleTime: 1000 * 60 * 60, // 设施位置属于静态低频数据，缓存 1 小时
    refetchOnWindowFocus: false,
  });
}

/**
 * Silent Wish (一键 SOS) データを取得
 */
export function useSilentWishes() {
  return useQuery({
    queryKey: ['silentWishes'] as const,
    queryFn: async () => {
      const response = await serviceNowAPI.getSilentWishes();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch Silent Wishes');
      }
      return response.data!;
    },
    staleTime: 1000 * 15, // 高频紧急数据，15秒即视为过期
    refetchInterval: 1000 * 30, // 30秒轮询
  });
}

/**
 * EOC Global States (Inventories & Volunteers)
 */
export function useInventories() {
  return useQuery({
    queryKey: ['inventories'] as const,
    queryFn: async () => {
      const response = await serviceNowAPI.getInventories();
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch inventories');
      return response.data!;
    },
    staleTime: 1000 * 30, // 30秒缓存
    refetchInterval: 1000 * 60, // 1分钟轮询
  });
}

export function useVolunteers() {
  return useQuery({
    queryKey: ['volunteers'] as const,
    queryFn: async () => {
      const response = await serviceNowAPI.getVolunteers();
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch volunteers');
      return response.data!;
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30, // 30秒高频轮询人力状态
  });
}

/**
 * グローバルダッシュボード統計 (Aggregate API)
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async () => {
      const response = await serviceNowAPI.getDashboardStats();
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch stats');
      return response.data!;
    },
    staleTime: 1000 * 30, // 30秒缓存
    refetchInterval: 1000 * 60, // 1分钟聚合刷新
  });
}

/**
 * タスク一覧を取得（インシデント別）
 */
export function useTasks(incidentId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks(incidentId!),
    queryFn: async () => {
      const response = await serviceNowAPI.getTasksByIncident(incidentId!);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch tasks');
      }
      return response.data!;
    },
    enabled: !!incidentId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================
// External API Hooks
// ============================================

/**
 * 地震データを取得
 * - キャッシュ: 1分（高頻度更新は避ける）
 * - 自動リフレッシュ: 2分
 */
export function useEarthquakes(
  params: { timeRange: 'hour' | 'day' | 'week' | 'month'; minMagnitude: 'all' | 'significant' | '1.0' | '2.5' | '4.5' } = 
    { timeRange: 'day', minMagnitude: '2.5' }
) {
  return useQuery({
    queryKey: queryKeys.earthquakes(params),
    queryFn: () => externalAPI.earthquake.getJapanEarthquakes(params),
    staleTime: 1000 * 60 * 1, // 1分間は新鮮
    refetchInterval: 1000 * 60 * 2, // 2分ごとにリフレッシュ
    retry: 2,
  });
}

/**
 * 天気データを取得
 * - キャッシュ: 10分
 */
export function useWeather(lat: number, lng: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.weather(lat, lng),
    queryFn: () => externalAPI.weather.getCurrentWeather(lat, lng),
    staleTime: 1000 * 60 * 10, // 10分
    refetchInterval: 1000 * 60 * 15, // 15分ごと
    enabled,
    retry: 2,
  });
}

/**
 * 天気予報を取得
 */
export function useForecast(lat: number, lng: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.forecast(lat, lng),
    queryFn: () => externalAPI.weather.getForecast(lat, lng),
    staleTime: 1000 * 60 * 30, // 30分
    enabled,
  });
}

/**
 * 気象警報を取得
 */
export function useWarnings(areaCode: string = '130000') {
  return useQuery({
    queryKey: queryKeys.warnings(areaCode),
    queryFn: () => externalAPI.jma.getWarnings(areaCode),
    staleTime: 1000 * 60 * 5, // 5分
    refetchInterval: 1000 * 60 * 10, // 10分ごと
    retry: 1, // JMA API はエラーになりやすい
  });
}

// ============================================
// 複合データ Hook
// ============================================

/**
 * ダッシュボード用の統合データ
 */
export function useDashboardData() {
  const incidents = useIncidents();
  const resources = useResources(); // 暂时保留旧的资产表，防止未重构的组件报错
  const locations = useLocations();
  const silentWishes = useSilentWishes();
  const inventories = useInventories(); // 新增
  const volunteers = useVolunteers(); // 新增
  const earthquakes = useEarthquakes();
  const weather = useWeather(35.6762, 139.6503);

  const isLoading = 
    incidents.isLoading || 
    resources.isLoading || 
    locations.isLoading || 
    silentWishes.isLoading || 
    inventories.isLoading || 
    volunteers.isLoading || 
    earthquakes.isLoading || 
    weather.isLoading;

  const isError = 
    incidents.isError || 
    resources.isError || 
    locations.isError || 
    silentWishes.isError || 
    inventories.isError || 
    volunteers.isError || 
    earthquakes.isError || 
    weather.isError;

  return {
    incidents: incidents.data || [],
    resources: resources.data || [],
    locations: locations.data || [],
    silentWishes: silentWishes.data || [],
    inventories: inventories.data || [],
    volunteers: volunteers.data || [],
    earthquakes: earthquakes.data || [],
    weather: weather.data || null,
    isLoading,
    isError,
    refetch: () => {
      incidents.refetch();
      resources.refetch();
      locations.refetch();
      silentWishes.refetch();
      inventories.refetch();
      volunteers.refetch();
      earthquakes.refetch();
      weather.refetch();
    },
  };
}

// ============================================
// Optimistic Updates Helper
// ============================================

/**
 * 楽観的更新を使用したインシデントステータス変更
 */
export function useOptimisticUpdateIncidentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, state }: { id: string; state: string }) => {
      const response = await serviceNowAPI.updateIncident(id, { state });
      if (!response.success) {
        throw new Error(response.error?.message);
      }
      return response.data!;
    },
    onMutate: async ({ id, state }) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: ['incidents'] });

      // 現在のデータをスナップショット
      const previousIncidents = queryClient.getQueryData(queryKeys.incidents());

      // 楽観的に更新
      queryClient.setQueryData(queryKeys.incidents(), (old: ServiceNowIncident[] | undefined) => 
        old?.map((inc) => 
          inc.sys_id === id ? { ...inc, state } : inc
        )
      );

      return { previousIncidents };
    },
    onError: (err, variables, context) => {
      // エラー時はロールバック
      if (context?.previousIncidents) {
        queryClient.setQueryData(queryKeys.incidents(), context.previousIncidents);
      }
    },
    onSettled: () => {
      // 完了後に再検証
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}
