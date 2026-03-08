// ============================================
// KOKORO EOC - TanStack Query Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceNowAPI } from '../services/servicenow';
import { externalAPI } from '../services/external-api';
import type {
  ServiceNowIncident,
  FilterOptions,
} from '../types';

// ============================================
// Query Keys
// ============================================
export const queryKeys = {
  incidents: (filters?: FilterOptions) => ['incidents', filters] as const,
  incident: (id: string) => ['incident', id] as const,
  resources: (filters?: FilterOptions) => ['resources', filters] as const,
  resource: (id: string) => ['resource', id] as const,
  locations: () => ['locations'] as const,
  tasks: (incidentId: string) => ['tasks', incidentId] as const,
  stats: () => ['stats'] as const,
  earthquakes: (params?: { timeRange: string; minMagnitude: string }) => 
    ['earthquakes', params] as const,
  weather: (lat: number, lng: number) => ['weather', lat, lng] as const,
  forecast: (lat: number, lng: number) => ['forecast', lat, lng] as const,
  warnings: (areaCode?: string) => ['warnings', areaCode] as const,
};

// ============================================
// ServiceNow Hooks
// ============================================

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
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

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
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

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
      queryClient.setQueryData(queryKeys.incident(variables.id), data);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

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
    refetchInterval: 1000 * 60,
  });
}

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
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}

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
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useInventories() {
  return useQuery({
    queryKey: ['inventories'] as const,
    queryFn: async () => {
      const response = await serviceNowAPI.getInventories();
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch inventories');
      return response.data!;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
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
    refetchInterval: 1000 * 30,
  });
}

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

export function useEarthquakes(
  params: { timeRange: 'hour' | 'day' | 'week' | 'month'; minMagnitude: 'all' | 'significant' | '1.0' | '2.5' | '4.5' } = 
    { timeRange: 'day', minMagnitude: '2.5' }
) {
  return useQuery({
    queryKey: queryKeys.earthquakes(params),
    queryFn: () => externalAPI.earthquake.getJapanEarthquakes(params),
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 2,
    retry: 2,
  });
}

export function useWeather(lat: number, lng: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.weather(lat, lng),
    queryFn: () => externalAPI.weather.getCurrentWeather(lat, lng),
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 15,
    enabled,
    retry: 2,
  });
}

export function useForecast(lat: number, lng: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.forecast(lat, lng),
    queryFn: () => externalAPI.weather.getForecast(lat, lng),
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}

export function useWarnings(areaCode: string = '130000') {
  return useQuery({
    queryKey: queryKeys.warnings(areaCode),
    queryFn: () => externalAPI.jma.getWarnings(areaCode),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    retry: 1,
  });
}

// ============================================
// Combined Dashboard Data
// ============================================

export function useDashboardData() {
  const incidents = useIncidents();
  const resources = useResources();
  const locations = useLocations();
  const silentWishes = useSilentWishes();
  const inventories = useInventories();
  const volunteers = useVolunteers();
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
// Optimistic Update
// ============================================

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
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      const previousIncidents = queryClient.getQueryData(queryKeys.incidents());
      queryClient.setQueryData(queryKeys.incidents(), (old: ServiceNowIncident[] | undefined) => 
        old?.map((inc) => 
          inc.sys_id === id ? { ...inc, state } : inc
        )
      );
      return { previousIncidents };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousIncidents) {
        queryClient.setQueryData(queryKeys.incidents(), context.previousIncidents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}
