// ============================================
// KOKORO EOC - ServiceNow API Service
// ============================================
// 这是与 ServiceNow PDI 交互的核心服务
// 所有 ServiceNow API 调用都通过这里

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ServiceNowIncident,
  ServiceNowTask,
  ServiceNowResource,
  ServiceNowLocation,
  ServiceNowSilentWish,
  APIResponse,
  FilterOptions,
} from '../types';

// ============================================
// 配置
// ============================================
interface ServiceNowAPIConfig {
  baseURL: string;
  username: string;
  password: string;
  apiVersion: string;
}

// 默认配置 - 实际使用时从环境变量读取
const DEFAULT_CONFIG: ServiceNowAPIConfig = {
  baseURL: (import.meta as any).env.VITE_SERVICENOW_INSTANCE_URL || 'https://your-instance.service-now.com',
  username: (import.meta as any).env.VITE_SERVICENOW_USERNAME || '',
  password: (import.meta as any).env.VITE_SERVICENOW_PASSWORD || '',
  apiVersion: 'v2',
};

// 表名映射
const TABLES = {
  // 标准表
  incidents: 'incident',
  tasks: 'sc_task',
  users: 'sys_user',
  locations: 'cmn_location',
  resources: 'alm_asset',
  
  // Kokoro 自定义表
  silent_wishes: 'x_1821654_kokoro_0_silent_wish',
  inventories: 'x_1821654_kokoro_0_kokoro_inventory',
  volunteers: 'x_1821654_kokoro_0_kokoro_volunteer',
  user_profiles: 'x_1821654_kokoro_0_x_kokoro_user_profile', // [新增] 避难者数据源
};

// ============================================
// API 客户端类
// ============================================
class ServiceNowAPIClient {
  private client: AxiosInstance;
  private config: ServiceNowAPIConfig;

  constructor(config: Partial<ServiceNowAPIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.client = axios.create({
      baseURL: `${this.config.baseURL}/api/now/${this.config.apiVersion}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      auth: {
        username: this.config.username,
        password: this.config.password,
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[ServiceNow API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[ServiceNow API Error]', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 401:
          return new Error('認証エラー: ServiceNow の認証情報を確認してください');
        case 403:
          return new Error('権限エラー: このリソースへのアクセス権がありません');
        case 404:
          return new Error('リソースが見つかりません');
        case 429:
          return new Error('レート制限: リクエストが多すぎます。しばらく待ってから再試行してください');
        default:
          return new Error(data?.error?.message || `ServiceNow API エラー (${status})`);
      }
    }
    return new Error('ネットワークエラー: ServiceNow に接続できません');
  }

  // ============================================
  // 汎用 CRUD メソッド
  // ============================================
  
  async getTable<T>(
    table: string,
    params: {
      query?: string;
      fields?: string[];
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
    } = {}
  ): Promise<APIResponse<T[]>> {
    try {
      const response = await this.client.get(`/table/${table}`, {
        params: {
          sysparm_query: params.query || '',
          sysparm_fields: params.fields?.join(',') || '',
          sysparm_limit: params.limit || 100,
          sysparm_offset: params.offset || 0,
          sysparm_display_value: 'true',
          sysparm_exclude_reference_link: 'true',
          ...(params.orderBy && {
            sysparm_orderby: `${params.orderDir === 'desc' ? '^' : ''}${params.orderBy}`,
          }),
        },
      });

      return {
        success: true,
        data: response.data.result,
        meta: {
          total: parseInt(response.headers['x-total-count'] || '0'),
          page: Math.floor((params.offset || 0) / (params.limit || 100)) + 1,
          limit: params.limit || 100,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getRecord<T>(table: string, sysId: string): Promise<APIResponse<T>> {
    try {
      const response = await this.client.get(`/table/${table}/${sysId}`, {
        params: {
          sysparm_display_value: 'true',
          sysparm_exclude_reference_link: 'true',
        },
      });

      return {
        success: true,
        data: response.data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async createRecord<T>(table: string, data: Partial<T>): Promise<APIResponse<T>> {
    try {
      const response = await this.client.post(`/table/${table}`, data, {
        params: {
          sysparm_display_value: 'true',
        },
      });

      return {
        success: true,
        data: response.data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async updateRecord<T>(
    table: string,
    sysId: string,
    data: Partial<T>
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.client.patch(`/table/${table}/${sysId}`, data, {
        params: {
          sysparm_display_value: 'true',
        },
      });

      return {
        success: true,
        data: response.data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async deleteRecord(table: string, sysId: string): Promise<APIResponse<null>> {
    try {
      await this.client.delete(`/table/${table}/${sysId}`);

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ============================================
  // インシデント専用メソッド
  // ============================================

  async getIncidents(filters: FilterOptions = {}): Promise<APIResponse<ServiceNowIncident[]>> {
    const queryParts: string[] = [];

    if (filters.status?.length) {
      queryParts.push(`stateIN${filters.status.join(',')}`);
    }
    if (filters.priority?.length) {
      queryParts.push(`priorityIN${filters.priority.join(',')}`);
    }
    if (filters.category?.length) {
      queryParts.push(`categoryIN${filters.category.join(',')}`);
    }
    if (filters.dateRange?.start) {
      queryParts.push(`opened_at>=${filters.dateRange.start}`);
    }
    if (filters.dateRange?.end) {
      queryParts.push(`opened_at<=${filters.dateRange.end}`);
    }
    if (filters.assignedTo) {
      queryParts.push(`assigned_to=${filters.assignedTo}`);
    }

    return this.getTable<ServiceNowIncident>(TABLES.incidents, {
      query: queryParts.join('^'),
      orderBy: 'opened_at',
      orderDir: 'desc',
      limit: 200,
    });
  }

  async getIncidentById(sysId: string): Promise<APIResponse<ServiceNowIncident>> {
    return this.getRecord<ServiceNowIncident>(TABLES.incidents, sysId);
  }

  async createIncident(
    data: Partial<ServiceNowIncident>
  ): Promise<APIResponse<ServiceNowIncident>> {
    return this.createRecord<ServiceNowIncident>(TABLES.incidents, data);
  }

  async updateIncident(
    sysId: string,
    data: Partial<ServiceNowIncident>
  ): Promise<APIResponse<ServiceNowIncident>> {
    return this.updateRecord<ServiceNowIncident>(TABLES.incidents, sysId, data);
  }

  // ============================================
  // リソース専用メソッド (alm_asset)
  // ============================================

  async getResources(filters: FilterOptions = {}): Promise<APIResponse<ServiceNowResource[]>> {
    const queryParts: string[] = [];

    if (filters.status?.length) {
      queryParts.push(`statusIN${filters.status.join(',')}`);
    }
    if (filters.category?.length) {
      queryParts.push(`typeIN${filters.category.join(',')}`);
    }

    return this.getTable<ServiceNowResource>(TABLES.resources, {
      query: queryParts.join('^'),
      orderBy: 'display_name',
      orderDir: 'asc',
      limit: 500,
    });
  }

  async updateResourceStatus(
    sysId: string,
    status: string
  ): Promise<APIResponse<ServiceNowResource>> {
    return this.updateRecord<ServiceNowResource>(TABLES.resources, sysId, { install_status: status });
  }

  // ============================================
  // ロケーション (避難所/施設) 専用メソッド
  // ============================================
  
  async getLocations(): Promise<APIResponse<ServiceNowLocation[]>> {
    return this.getTable<ServiceNowLocation>(TABLES.locations, {
      query: 'latitudeISNOTEMPTY^longitudeISNOTEMPTY^x_1821654_kokoro_0_eoc_site_typeISNOTEMPTY',
      limit: 100,
    });
  }

  // ============================================
  // Silent Wish (一键 SOS) 専用メソッド
  // ============================================
  
  async getSilentWishes(): Promise<APIResponse<ServiceNowSilentWish[]>> {
    return this.getTable<ServiceNowSilentWish>(TABLES.silent_wishes, {
      query: 'latitudeISNOTEMPTY^longitudeISNOTEMPTY',
      limit: 100,
      orderBy: 'sys_created_on',
      orderDir: 'desc',
    });
  }

  // ============================================
  // Kokoro Inventory (物资库存) 専用メソッド
  // ============================================
  
  async getInventories(): Promise<APIResponse<any[]>> {
    return this.getTable<any>(TABLES.inventories, {
      limit: 200,
      orderBy: 'item_name',
      orderDir: 'asc',
    });
  }

  // ============================================
  // Kokoro Volunteer (志愿者) 専用メソッド
  // ============================================
  
  async getVolunteers(): Promise<APIResponse<any[]>> {
    return this.getTable<any>(TABLES.volunteers, {
      limit: 200,
      orderBy: 'name',
      orderDir: 'asc',
    });
  }

  // ============================================
  // タスク専用メソッド
  // ============================================

  async getTasksByIncident(incidentSysId: string): Promise<APIResponse<ServiceNowTask[]>> {
    return this.getTable<ServiceNowTask>(TABLES.tasks, {
      query: `parent=${incidentSysId}`,
      orderBy: 'priority',
      orderDir: 'asc',
    });
  }

  async createTask(data: Partial<ServiceNowTask>): Promise<APIResponse<ServiceNowTask>> {
    return this.createRecord<ServiceNowTask>(TABLES.tasks, data);
  }

  async updateTaskStatus(
    sysId: string,
    state: ServiceNowTask['state']
  ): Promise<APIResponse<ServiceNowTask>> {
    return this.updateRecord<ServiceNowTask>(TABLES.tasks, sysId, { state });
  }

  // ============================================
  // 集計・統計 (Aggregate API)
  // ============================================

  /**
   * ServiceNow Aggregate API 核心调用器
   * 强制在数据库层完成计算，拒绝全量数据传输
   */
  async getAggregate(
    table: string,
    query: string,
    aggregateType: 'COUNT' | 'SUM' | 'AVG' = 'COUNT',
    aggregateField?: string
  ): Promise<number> {
    try {
      const response = await this.client.get(`/stats/${table}`, {
        params: {
          sysparm_query: query,
          sysparm_count: aggregateType === 'COUNT' ? 'true' : undefined,
          sysparm_sum_field: aggregateType === 'SUM' ? aggregateField : undefined,
          sysparm_avg_field: aggregateType === 'AVG' ? aggregateField : undefined,
        },
      });
      
      const stats = response.data.result.stats;
      if (!stats) return 0;
      
      if (aggregateType === 'COUNT') return parseInt(stats.count || '0', 10);
      if (aggregateType === 'SUM') return parseFloat(stats.sum || '0');
      if (aggregateType === 'AVG') return parseFloat(stats.avg || '0');
      return 0;
    } catch (error) {
      console.error(`[Aggregate API Error] Table: ${table}`, error);
      return 0; // 静默降级，保障控制台不白屏
    }
  }

  /**
   * 并发拉取全局监控指标
   * 注意: 假设物资表数量字段为 'quantity'，志愿者状态字段为 'u_status'
   */
  async getDashboardStats(): Promise<APIResponse<any>> {
    try {
      const [
        activeIncidents,
        criticalIncidents,
        resolvedToday,
        dispatched,
        activePersonnel,
        evacuees,
        resourcesCount
      ] = await Promise.all([
        this.getAggregate(TABLES.silent_wishes, 'stateIN10,11,2,6', 'COUNT'),
        this.getAggregate(TABLES.silent_wishes, 'priority=1^stateIN10,11,2,6', 'COUNT'), 
        this.getAggregate(TABLES.silent_wishes, 'state=4^sys_updated_onONToday@javascript:gs.daysAgoStart(0)@javascript:gs.daysAgoEnd(0)', 'COUNT'),
        this.getAggregate(TABLES.volunteers, 'u_status=engaged', 'COUNT'), // 视实例字典调整 u_status
        this.getAggregate(TABLES.volunteers, 'u_statusINonline,engaged', 'COUNT'),
        this.getAggregate(TABLES.user_profiles, '', 'COUNT'),
        this.getAggregate(TABLES.inventories, '', 'SUM', 'quantity') // 视实例字典调整 quantity，若无字段则回退为 0
      ]);

      return {
        success: true,
        data: {
          active_incidents: activeIncidents,
          critical_incidents: criticalIncidents,
          resolved_today: resolvedToday,
          deployed_resources: dispatched,
          active_personnel: activePersonnel,
          sheltered_population: evacuees,
          total_resources: resourcesCount,
          response_time_avg: 8.5 // SLA涉及 task_sla 表复杂关联，现阶段保持硬编码基准值
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// ============================================
// シングルトンインスタンスをエクスポート
// ============================================
export const serviceNowAPI = new ServiceNowAPIClient();

// 設定更新用の関数
export const configureServiceNow = (config: Partial<ServiceNowAPIConfig>) => {
  return new ServiceNowAPIClient(config);
};

export default serviceNowAPI;
