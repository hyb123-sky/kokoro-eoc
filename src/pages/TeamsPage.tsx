// ============================================
// KOKORO EOC - Teams Page
// ============================================

import React from 'react';
import { Users, Plus, Search, UserCheck, MapPin } from 'lucide-react';
import clsx from 'clsx';

const TeamsPage: React.FC = () => {
  const teams = [
    { id: 1, name: '救急医療チーム A', leader: '山田太郎', members: 8, status: 'deployed', location: '東京都港区' },
    { id: 2, name: '物資輸送チーム B', leader: '佐藤花子', members: 5, status: 'available', location: '待機中' },
    { id: 3, name: '避難所運営チーム C', leader: '鈴木一郎', members: 12, status: 'deployed', location: '渋谷区避難所' },
    { id: 4, name: '情報収集チーム D', leader: '田中美咲', members: 4, status: 'available', location: '待機中' },
  ];

  return (
    <div className="h-full flex flex-col bg-kokoro-dark">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-kokoro-border bg-kokoro-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-kokoro-accent" />
            <h1 className="text-xl font-display font-bold text-white">対応チーム</h1>
            <span className="px-3 py-1 text-sm font-mono bg-kokoro-darker rounded text-kokoro-muted">
              {teams.length} チーム
            </span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80">
            <Plus className="w-4 h-4" />
            新規チーム
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-kokoro-success" />
            <span className="text-sm text-kokoro-muted">待機中: <span className="text-white font-bold">2</span></span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-kokoro-warning" />
            <span className="text-sm text-kokoro-muted">派遣中: <span className="text-white font-bold">2</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-kokoro-info" />
            <span className="text-sm text-kokoro-muted">総人員: <span className="text-white font-bold">29</span></span>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kokoro-muted" />
          <input
            type="text"
            placeholder="チームを検索..."
            className="w-full pl-10 pr-4 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white placeholder-kokoro-muted focus:outline-none focus:border-kokoro-accent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border hover:border-kokoro-accent/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-white">{team.name}</h3>
                <span className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  team.status === 'deployed' ? 'bg-kokoro-warning/20 text-kokoro-warning' : 'bg-kokoro-success/20 text-kokoro-success'
                )}>
                  {team.status === 'deployed' ? '派遣中' : '待機中'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-kokoro-muted">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>リーダー: {team.leader}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>メンバー: {team.members}名</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{team.location}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs bg-kokoro-darker text-white rounded hover:bg-kokoro-border">
                  詳細
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs bg-kokoro-accent text-kokoro-dark rounded hover:bg-kokoro-accent/80">
                  派遣
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
