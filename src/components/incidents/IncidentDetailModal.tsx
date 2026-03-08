// ============================================
// KOKORO EOC - Incident Detail Modal (With Actions)
// ============================================
// CAD 系统核心组件：工单详情弹窗 + 操作按钮

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  User,
  Users,
  AlertTriangle,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle,
  XCircle,
  Truck,
  Activity,
  Loader2,
  Send,
} from 'lucide-react';
import { useMapStore } from '../../stores';
import { serviceNowAPI } from '../../services/servicenow';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';

// ============================================
// Types
// ============================================
interface IncidentDetail {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  priority: string;
  state: string;
  locationName: string;
  assigned_to?: string;
  assignment_group?: string;
  opened_at: string;
  updated_at?: string;
  u_latitude?: number;
  u_longitude?: number;
  u_affected_population?: number;
  contact_info?: string;
  wish_content?: string;
  shelter_zone?: string;
  urgency?: string;
  isSOS?: boolean;
}

interface IncidentDetailModalProps {
  incident: IncidentDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // 用于刷新数据
}

// ============================================
// Priority Config
// ============================================
const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  '1': { label: 'P1 - 緊急', color: 'text-status-critical', bgColor: 'bg-status-critical' },
  '2': { label: 'P2 - 高', color: 'text-status-high', bgColor: 'bg-status-high' },
  '3': { label: 'P3 - 中', color: 'text-status-medium', bgColor: 'bg-status-medium' },
  '4': { label: 'P4 - 低', color: 'text-status-low', bgColor: 'bg-status-low' },
  '5': { label: 'P5 - 計画', color: 'text-kokoro-muted', bgColor: 'bg-kokoro-muted' },
};

const stateConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'new': { label: '新規', color: 'text-kokoro-info', icon: AlertTriangle },
  '提出済み': { label: '提出済み', color: 'text-kokoro-info', icon: AlertTriangle },
  'work_in_progress': { label: '対応中', color: 'text-kokoro-warning', icon: Activity },
  '担当者決定': { label: '担当者決定', color: 'text-kokoro-warning', icon: User },
  '配送中': { label: '配送中', color: 'text-kokoro-accent', icon: Truck },
  'resolved': { label: '解決', color: 'text-kokoro-success', icon: CheckCircle },
  '完了': { label: '完了', color: 'text-kokoro-success', icon: CheckCircle },
  'closed': { label: 'クローズ', color: 'text-kokoro-muted', icon: XCircle },
};

// ============================================
// Resource Dispatch Modal
// ============================================
const ResourceDispatchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  incidentNumber: string;
}> = ({ isOpen, onClose, incidentNumber }) => {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  const mockResources = [
    { id: '1', name: '救急車 A-01', type: '車両', status: '待機中' },
    { id: '2', name: '消防車 F-03', type: '車両', status: '待機中' },
    { id: '3', name: '医療キット #12', type: '医療', status: '利用可能' },
    { id: '4', name: '給水車 W-02', type: '車両', status: '待機中' },
  ];

  const handleDispatch = async () => {
    if (selectedResources.length === 0) return;
    
    setIsDispatching(true);
    // TODO: 実際のServiceNow API呼び出し
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDispatching(false);
    onClose();
    alert(`${selectedResources.length}件のリソースを ${incidentNumber} に派遣しました`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-kokoro-panel border border-kokoro-border rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-kokoro-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-kokoro-accent" />
            リソース配置
          </h3>
          <button onClick={onClose} className="p-1 text-kokoro-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[300px] overflow-y-auto">
          <p className="text-xs text-kokoro-muted mb-3">
            {incidentNumber} に派遣するリソースを選択してください
          </p>
          
          <div className="space-y-2">
            {mockResources.map(resource => (
              <label
                key={resource.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedResources.includes(resource.id)
                    ? 'bg-kokoro-accent/10 border-kokoro-accent'
                    : 'bg-kokoro-darker border-kokoro-border hover:border-kokoro-muted'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedResources.includes(resource.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedResources([...selectedResources, resource.id]);
                    } else {
                      setSelectedResources(selectedResources.filter(id => id !== resource.id));
                    }
                  }}
                  className="w-4 h-4 rounded border-kokoro-border"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{resource.name}</p>
                  <p className="text-xs text-kokoro-muted">{resource.type} • {resource.status}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-kokoro-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-kokoro-muted hover:text-white transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleDispatch}
            disabled={selectedResources.length === 0 || isDispatching}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors',
              selectedResources.length > 0
                ? 'bg-kokoro-accent text-kokoro-dark hover:bg-kokoro-accent/80'
                : 'bg-kokoro-border text-kokoro-muted cursor-not-allowed'
            )}
          >
            {isDispatching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                派遣中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                派遣 ({selectedResources.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================
const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { flyTo } = useMapStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  if (!isOpen || !incident) return null;

  const priority = priorityConfig[incident.priority] || priorityConfig['5'];
  const state = stateConfig[incident.state] || stateConfig['new'];
  const StateIcon = state.icon;

  const handleNavigate = () => {
    if (incident.u_latitude && incident.u_longitude) {
      flyTo(incident.u_latitude, incident.u_longitude, 16);
      onClose();
    }
  };

  const handleUpdateStatus = async (newState: string) => {
    setIsUpdating(true);
    
    try {
      // Silent Wish テーブルを更新
      const response = await serviceNowAPI.updateRecord(
        'x_1821654_kokoro_0_silent_wish',
        incident.sys_id,
        { state: newState }
      );
      
      if (response.success) {
        // 成功メッセージ
        const stateLabel = stateConfig[newState]?.label || newState;
        alert(`ステータスを「${stateLabel}」に更新しました`);
        
        // データを再取得
        if (onUpdate) {
          onUpdate();
        }
        
        onClose();
      } else {
        throw new Error(response.error?.message || '更新に失敗しました');
      }
    } catch (error) {
      console.error('Status update failed:', error);
      alert(`更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatch = () => {
    setShowDispatchModal(true);
  };

  // 判断是否已完成
  const isCompleted = ['完了', 'resolved', 'closed'].includes(incident.state);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-kokoro-panel border border-kokoro-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className={clsx(
            'px-6 py-4 border-b border-kokoro-border flex items-start justify-between',
            incident.isSOS && 'bg-status-critical/10'
          )}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={clsx(
                  'px-2 py-1 text-xs font-bold rounded',
                  priority.bgColor,
                  incident.priority === '3' || incident.priority === '4' ? 'text-kokoro-dark' : 'text-white'
                )}>
                  {priority.label}
                </span>
                <span className="font-mono text-sm text-kokoro-muted">
                  {incident.number}
                </span>
                {incident.isSOS && (
                  <span className="px-2 py-1 text-xs font-bold bg-status-critical text-white rounded animate-pulse">
                    🆘 SOS
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-white">
                {incident.short_description}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-kokoro-muted hover:text-white hover:bg-kokoro-border rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-kokoro-darker rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StateIcon className={clsx('w-4 h-4', state.color)} />
                  <span className="text-xs text-kokoro-muted">ステータス</span>
                </div>
                <span className={clsx('text-lg font-semibold', state.color)}>
                  {state.label}
                </span>
              </div>
              <div className="bg-kokoro-darker rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-kokoro-muted" />
                  <span className="text-xs text-kokoro-muted">経過時間</span>
                </div>
                <span className="text-lg font-semibold text-white">
                  {formatDistanceToNow(new Date(incident.opened_at), { locale: ja })}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="bg-kokoro-darker rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-kokoro-accent" />
                  <span className="text-sm font-medium text-white">位置情報</span>
                </div>
                {incident.u_latitude && incident.u_longitude && (
                  <button
                    onClick={handleNavigate}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80 transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    地図で表示
                  </button>
                )}
              </div>
              <p className="text-kokoro-muted mb-2">{incident.locationName}</p>
              {incident.u_latitude && incident.u_longitude && (
                <p className="text-xs font-mono text-kokoro-muted">
                  LAT: {incident.u_latitude.toFixed(6)}, LNG: {incident.u_longitude.toFixed(6)}
                </p>
              )}
              {incident.shelter_zone && (
                <p className="text-xs text-kokoro-muted mt-2">
                  エリア: <span className="text-white">{incident.shelter_zone}</span>
                </p>
              )}
            </div>

            {/* Description / Wish Content */}
            {(incident.description || incident.wish_content) && (
              <div className="bg-kokoro-darker rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-kokoro-muted" />
                  <span className="text-sm font-medium text-white">詳細内容</span>
                </div>
                <p className="text-sm text-kokoro-muted whitespace-pre-wrap">
                  {incident.wish_content || incident.description}
                </p>
              </div>
            )}

            {/* Assignment */}
            <div className="bg-kokoro-darker rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-kokoro-muted" />
                <span className="text-sm font-medium text-white">担当情報</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-kokoro-muted">担当者:</span>
                  <span className="ml-2 text-white">
                    {incident.assigned_to || '未割当'}
                  </span>
                </div>
                <div>
                  <span className="text-kokoro-muted">グループ:</span>
                  <span className="ml-2 text-white">
                    {incident.assignment_group || '未割当'}
                  </span>
                </div>
              </div>
            </div>

            {/* Affected Population */}
            {incident.u_affected_population && (
              <div className="bg-status-critical/10 border border-status-critical/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-status-critical" />
                  <span className="text-sm font-medium text-status-critical">
                    影響人数: {incident.u_affected_population.toLocaleString()}人
                  </span>
                </div>
              </div>
            )}

            {/* Contact Info */}
            {incident.contact_info && (
              <div className="bg-kokoro-darker rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-kokoro-muted" />
                  <span className="text-sm font-medium text-white">連絡先</span>
                </div>
                <p className="text-sm text-kokoro-accent">{incident.contact_info}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-kokoro-darker rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-kokoro-muted" />
                <span className="text-sm font-medium text-white">タイムライン</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-kokoro-accent" />
                  <div>
                    <p className="text-xs text-kokoro-muted">
                      {format(new Date(incident.opened_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </p>
                    <p className="text-sm text-white">インシデント作成</p>
                  </div>
                </div>
                {incident.updated_at && incident.updated_at !== incident.opened_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-kokoro-warning" />
                    <div>
                      <p className="text-xs text-kokoro-muted">
                        {format(new Date(incident.updated_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </p>
                      <p className="text-sm text-white">最終更新</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-kokoro-border flex items-center justify-between bg-kokoro-darker">
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('担当者決定')}
                    disabled={isUpdating}
                    className={clsx(
                      'px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                      isUpdating
                        ? 'bg-kokoro-border text-kokoro-muted cursor-not-allowed'
                        : 'bg-kokoro-warning text-kokoro-dark hover:bg-kokoro-warning/80'
                    )}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    対応開始
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('完了')}
                    disabled={isUpdating}
                    className={clsx(
                      'px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                      isUpdating
                        ? 'bg-kokoro-border text-kokoro-muted cursor-not-allowed'
                        : 'bg-kokoro-success text-white hover:bg-kokoro-success/80'
                    )}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    解決
                  </button>
                </>
              )}
              {isCompleted && (
                <span className="text-sm text-kokoro-success flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  このインシデントは完了しています
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <button
                  onClick={handleDispatch}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80 transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  リソース配置
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Dispatch Modal */}
      <ResourceDispatchModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        incidentNumber={incident.number}
      />
    </>
  );
};

export default IncidentDetailModal;
