// ============================================
// KOKORO EOC - Settings Page
// ============================================

import React, { useState } from 'react';
import { Settings, Save, Globe, Bell, Shield, Database, Palette, Monitor, Server, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', label: '一般設定', icon: Settings },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'security', label: 'セキュリティ', icon: Shield },
    { id: 'integrations', label: '外部連携', icon: Database },
    { id: 'appearance', label: '表示', icon: Palette },
  ];

  return (
    <div className="h-full flex bg-kokoro-dark">
      {/* Sidebar */}
      <div className="w-64 bg-kokoro-panel border-r border-kokoro-border p-4">
        <h1 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-kokoro-accent" />
          設定
        </h1>
        <nav className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-kokoro-accent/10 text-kokoro-accent'
                  : 'text-kokoro-muted hover:text-white hover:bg-kokoro-darker'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-display font-bold text-white mb-6">一般設定</h2>
            
            <div className="space-y-6">
              {/* Language */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-kokoro-accent" />
                  <h3 className="font-medium text-white">言語</h3>
                </div>
                <select className="w-full px-3 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white focus:outline-none focus:border-kokoro-accent">
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-5 h-5 text-kokoro-accent" />
                  <h3 className="font-medium text-white">タイムゾーン</h3>
                </div>
                <select className="w-full px-3 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white focus:outline-none focus:border-kokoro-accent">
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* Refresh Interval */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCw className="w-5 h-5 text-kokoro-accent" />
                  <h3 className="font-medium text-white">データ更新間隔</h3>
                </div>
                <select className="w-full px-3 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white focus:outline-none focus:border-kokoro-accent">
                  <option value="15">15秒</option>
                  <option value="30">30秒</option>
                  <option value="60">1分</option>
                  <option value="300">5分</option>
                </select>
              </div>

              <button className="flex items-center gap-2 px-6 py-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80">
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-display font-bold text-white mb-6">外部連携</h2>
            
            <div className="space-y-4">
              {/* ServiceNow */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-kokoro-accent" />
                    <h3 className="font-medium text-white">ServiceNow</h3>
                  </div>
                  <span className="px-2 py-1 text-xs bg-kokoro-success/20 text-kokoro-success rounded-full">接続中</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-kokoro-muted">Instance URL</label>
                    <input 
                      type="text" 
                      value="https://dev269536.service-now.com" 
                      disabled
                      className="w-full px-3 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-kokoro-muted">API User</label>
                    <input 
                      type="text" 
                      value="kokoro_api_user" 
                      disabled
                      className="w-full px-3 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* USGS */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-kokoro-info" />
                    <h3 className="font-medium text-white">USGS 地震 API</h3>
                  </div>
                  <span className="px-2 py-1 text-xs bg-kokoro-success/20 text-kokoro-success rounded-full">接続中</span>
                </div>
                <p className="text-sm text-kokoro-muted">earthquake.usgs.gov - 公開 API (キー不要)</p>
              </div>

              {/* Open-Meteo */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-kokoro-warning" />
                    <h3 className="font-medium text-white">Open-Meteo 天気 API</h3>
                  </div>
                  <span className="px-2 py-1 text-xs bg-kokoro-success/20 text-kokoro-success rounded-full">接続中</span>
                </div>
                <p className="text-sm text-kokoro-muted">api.open-meteo.com - 公開 API (キー不要)</p>
              </div>

              {/* Mapbox */}
              <div className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-kokoro-accent" />
                    <h3 className="font-medium text-white">Mapbox</h3>
                  </div>
                  <span className="px-2 py-1 text-xs bg-kokoro-success/20 text-kokoro-success rounded-full">接続中</span>
                </div>
                <div>
                  <label className="text-xs text-kokoro-muted">Access Token</label>
                  <input 
                    type="password" 
                    value="pk.eyJ1I..." 
                    disabled
                    className="w-full px-3 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'general' && activeTab !== 'integrations' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-display font-bold text-white mb-6">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <div className="p-8 bg-kokoro-panel rounded-lg border border-kokoro-border text-center">
              <Settings className="w-12 h-12 text-kokoro-muted mx-auto mb-4" />
              <p className="text-kokoro-muted">この設定ページは開発中です</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
