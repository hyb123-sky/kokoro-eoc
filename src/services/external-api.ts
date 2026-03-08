// ============================================
// KOKORO EOC - External API Services
// ============================================
// 外部 API との連携
// - USGS 地震 API
// - OpenWeatherMap API  
// - JMA (気象庁) API

import axios from 'axios';
import type {
  EarthquakeAPIResponse,
  EarthquakeEvent,
  WeatherData,
  WeatherAlert,
} from '../types';

// ============================================
// 地震 API (USGS)
// ============================================
const USGS_BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

export interface EarthquakeQueryParams {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  minMagnitude: 'all' | 'significant' | '1.0' | '2.5' | '4.5';
}

export const earthquakeAPI = {
  /**
   * 地震データを取得
   * @param params クエリパラメータ
   */
  async getEarthquakes(
    params: EarthquakeQueryParams = { timeRange: 'day', minMagnitude: '2.5' }
  ): Promise<EarthquakeEvent[]> {
    const { timeRange, minMagnitude } = params;
    
    // USGS フィード URL を構築
    let feedType = minMagnitude === 'significant' ? 'significant' : `${minMagnitude}`;
    if (minMagnitude === 'all') feedType = 'all';
    
    const url = `${USGS_BASE_URL}/${feedType}_${timeRange}.geojson`;
    
    try {
      const response = await axios.get<EarthquakeAPIResponse>(url);
      return response.data.features;
    } catch (error) {
      console.error('[Earthquake API Error]', error);
      throw new Error('地震データの取得に失敗しました');
    }
  },

  /**
   * 特定地域の地震をフィルタリング
   * @param earthquakes 地震データ配列
   * @param bounds 境界ボックス {minLat, maxLat, minLng, maxLng}
   */
  filterByRegion(
    earthquakes: EarthquakeEvent[],
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  ): EarthquakeEvent[] {
    return earthquakes.filter((eq) => {
      const [lng, lat] = eq.geometry.coordinates;
      return (
        lat >= bounds.minLat &&
        lat <= bounds.maxLat &&
        lng >= bounds.minLng &&
        lng <= bounds.maxLng
      );
    });
  },

  /**
   * 日本周辺の地震を取得
   */
  async getJapanEarthquakes(
    params: EarthquakeQueryParams = { timeRange: 'week', minMagnitude: '2.5' }
  ): Promise<EarthquakeEvent[]> {
    const allEarthquakes = await this.getEarthquakes(params);
    
    // 日本周辺の境界
    const japanBounds = {
      minLat: 24,
      maxLat: 46,
      minLng: 122,
      maxLng: 154,
    };
    
    return this.filterByRegion(allEarthquakes, japanBounds);
  },

  /**
   * 地震の深刻度レベルを計算
   */
  getSeverityLevel(magnitude: number): 'low' | 'medium' | 'high' | 'critical' {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 5.5) return 'high';
    if (magnitude >= 4.0) return 'medium';
    return 'low';
  },

  /**
   * 地震のアラートカラーを取得
   */
  getAlertColor(magnitude: number): string {
    if (magnitude >= 7.0) return '#ff006e';
    if (magnitude >= 5.5) return '#ff6b35';
    if (magnitude >= 4.0) return '#ffd60a';
    return '#06d6a0';
  },
};

// ============================================
// 天気 API (Open-Meteo - 無料、APIキー不要)
// ============================================
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

export const weatherAPI = {
  /**
   * 現在の天気を取得
   * @param lat 緯度
   * @param lng 経度
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation',
            'weather_code',
            'wind_speed_10m',
            'wind_direction_10m',
            'pressure_msl',
            'visibility',
          ].join(','),
          timezone: 'Asia/Tokyo',
        },
      });

      const current = response.data.current;
      
      return {
        location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
        temperature: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        pressure: current.pressure_msl,
        wind_speed: current.wind_speed_10m,
        wind_direction: current.wind_direction_10m,
        visibility: current.visibility || 10000,
        condition: this.getWeatherCondition(current.weather_code),
        icon: this.getWeatherIcon(current.weather_code),
        precipitation: current.precipitation,
        uv_index: 0,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Weather API Error]', error);
      throw new Error('天気データの取得に失敗しました');
    }
  },

  /**
   * 天気予報を取得 (7日間)
   */
  async getForecast(lat: number, lng: number): Promise<{
    daily: {
      date: string;
      temp_max: number;
      temp_min: number;
      precipitation_probability: number;
      weather_code: number;
    }[];
  }> {
    try {
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_probability_max',
            'weather_code',
          ].join(','),
          timezone: 'Asia/Tokyo',
          forecast_days: 7,
        },
      });

      const daily = response.data.daily;
      
      return {
        daily: daily.time.map((date: string, i: number) => ({
          date,
          temp_max: daily.temperature_2m_max[i],
          temp_min: daily.temperature_2m_min[i],
          precipitation_probability: daily.precipitation_probability_max[i],
          weather_code: daily.weather_code[i],
        })),
      };
    } catch (error) {
      console.error('[Weather Forecast API Error]', error);
      throw new Error('天気予報の取得に失敗しました');
    }
  },

  /**
   * WMO 天気コードから条件文字列を取得
   */
  getWeatherCondition(code: number): string {
    const conditions: Record<number, string> = {
      0: '快晴',
      1: '晴れ',
      2: '一部曇り',
      3: '曇り',
      45: '霧',
      48: '着霜霧',
      51: '小雨',
      53: '雨',
      55: '大雨',
      61: '小雨',
      63: '雨',
      65: '大雨',
      71: '小雪',
      73: '雪',
      75: '大雪',
      77: '霧雪',
      80: 'にわか雨',
      81: 'にわか雨',
      82: '激しいにわか雨',
      85: 'にわか雪',
      86: '激しいにわか雪',
      95: '雷雨',
      96: '雷雨（ひょう）',
      99: '激しい雷雨（ひょう）',
    };
    return conditions[code] || '不明';
  },

  /**
   * WMO 天気コードからアイコン名を取得
   */
  getWeatherIcon(code: number): string {
    if (code === 0) return 'sun';
    if (code <= 3) return 'cloud-sun';
    if (code <= 48) return 'cloud-fog';
    if (code <= 65) return 'cloud-rain';
    if (code <= 77) return 'cloud-snow';
    if (code <= 82) return 'cloud-drizzle';
    if (code <= 86) return 'snowflake';
    return 'cloud-lightning';
  },

  /**
   * 災害関連の警報レベルを判定
   */
  getAlertLevel(weather: WeatherData): 'none' | 'advisory' | 'warning' | 'emergency' {
    // 風速による判定
    if (weather.wind_speed >= 30) return 'emergency';
    if (weather.wind_speed >= 20) return 'warning';
    if (weather.wind_speed >= 15) return 'advisory';
    
    // 降水量による判定
    if (weather.precipitation >= 50) return 'emergency';
    if (weather.precipitation >= 30) return 'warning';
    if (weather.precipitation >= 10) return 'advisory';
    
    return 'none';
  },
};

// ============================================
// JMA (気象庁) 気象警報 API
// ============================================
const JMA_BASE_URL = 'https://www.jma.go.jp/bosai';

export const jmaAPI = {
  /**
   * 気象警報・注意報を取得
   * @param areaCode 地域コード (東京: 130000)
   */
  async getWarnings(areaCode: string = '130000'): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(
        `${JMA_BASE_URL}/warning/${areaCode}.json`
      );
      
      // JMA のレスポンスを WeatherAlert 形式に変換
      const warnings = response.data?.warnings || [];
      
      return warnings.map((w: any, index: number) => ({
        id: `jma-${areaCode}-${index}`,
        event: w.type || '気象警報',
        headline: w.headline || '',
        description: w.text || '',
        severity: this.mapSeverity(w.status),
        urgency: 'immediate',
        areas: [w.area || areaCode],
        effective: w.publishingOffice?.dateTime || new Date().toISOString(),
        expires: w.validDateTime || new Date(Date.now() + 86400000).toISOString(),
      }));
    } catch (error) {
      console.error('[JMA API Error]', error);
      // JMA API はエラーになりやすいので空配列を返す
      return [];
    }
  },

  mapSeverity(status: string): WeatherAlert['severity'] {
    if (status === '特別警報') return 'extreme';
    if (status === '警報') return 'severe';
    if (status === '注意報') return 'moderate';
    return 'minor';
  },
};

// ============================================
// 統合 API サービス
// ============================================
export const externalAPI = {
  earthquake: earthquakeAPI,
  weather: weatherAPI,
  jma: jmaAPI,
  
  /**
   * 全ての災害関連データを一括取得
   */
  async getAllDisasterData(location: { lat: number; lng: number }) {
    const [earthquakes, weather, warnings] = await Promise.allSettled([
      earthquakeAPI.getJapanEarthquakes({ timeRange: 'day', minMagnitude: '2.5' }),
      weatherAPI.getCurrentWeather(location.lat, location.lng),
      jmaAPI.getWarnings(),
    ]);

    return {
      earthquakes: earthquakes.status === 'fulfilled' ? earthquakes.value : [],
      weather: weather.status === 'fulfilled' ? weather.value : null,
      warnings: warnings.status === 'fulfilled' ? warnings.value : [],
    };
  },
};

export default externalAPI;
