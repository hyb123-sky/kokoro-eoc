// ============================================
// KOKORO EOC - Reports Page
// ============================================

import React from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const reports = [
    { id: 1, name: '日次インシデントレポート', date: '2024-03-08', type: 'daily', status: 'ready' },
    { id: 2, name: '週次リソース消費レポート', date: '2024-03-04', type: 'weekly', status: 'ready' },
    { id: 3, name: '月次避難所統計', date: '2024-03-01', type: 'monthly', status: 'generating' },
    { id: 4, name: 'ボランティア活動サマリー', date: '2024-03-07', type: 'custom', status: 'ready' },
  ];

  return (
    <div className="h-full flex flex-col bg-kokoro-dark">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-kokoro-border bg-kokoro-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-kokoro-accent" />
            <h1 className="text-xl font-display font-bold text-white">レポート</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80">
            <FileText className="w-4 h-4" />
            新規レポート作成
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-kokoro-darker rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-kokoro-accent" />
              <span className="text-sm text-kokoro-muted">今月のインシデント</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">156</p>
            <p className="text-xs text-kokoro-success">▲ 12% 先月比</p>
          </div>
          <div className="p-4 bg-kokoro-darker rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <PieChart className="w-5 h-5 text-kokoro-info" />
              <span className="text-sm text-kokoro-muted">解決率</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">87.5%</p>
            <p className="text-xs text-kokoro-success">▲ 3.2% 先月比</p>
          </div>
          <div className="p-4 bg-kokoro-darker rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-kokoro-warning" />
              <span className="text-sm text-kokoro-muted">平均対応時間</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">2.4h</p>
            <p className="text-xs text-kokoro-warning">▼ 0.3h 先月比</p>
          </div>
        </div>
      </div>

      {/* Report List */}
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-lg font-medium text-white mb-4">最近のレポート</h2>
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="flex items-center justify-between p-4 bg-kokoro-panel rounded-lg border border-kokoro-border hover:border-kokoro-accent/50 transition-all">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-kokoro-accent" />
                <div>
                  <h3 className="font-medium text-white">{report.name}</h3>
                  <p className="text-sm text-kokoro-muted flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {report.date}
                    <span className="px-2 py-0.5 text-xs bg-kokoro-darker rounded">{report.type}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {report.status === 'generating' ? (
                  <span className="px-3 py-1 text-xs bg-kokoro-warning/20 text-kokoro-warning rounded-full">生成中...</span>
                ) : (
                  <button className="flex items-center gap-2 px-4 py-2 bg-kokoro-darker text-white rounded-lg hover:bg-kokoro-border">
                    <Download className="w-4 h-4" />
                    ダウンロード
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
