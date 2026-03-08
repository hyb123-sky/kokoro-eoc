// ============================================
// KOKORO EOC - AI Copilot Component
// ============================================
// AI 辅助决策面板 - 预留集成位置

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAICopilotStore } from '../../stores';
import clsx from 'clsx';

// ============================================
// Suggestion Card Component
// ============================================
const SuggestionCard: React.FC<{
  type: string;
  title: string;
  description: string;
  confidence: number;
  onAccept: () => void;
  onDismiss: () => void;
}> = ({ type, title, description, confidence, onAccept, onDismiss }) => {
  const getTypeConfig = (t: string) => {
    switch (t) {
      case 'resource_allocation':
        return { icon: TrendingUp, color: 'text-kokoro-info', bg: 'bg-kokoro-info/10' };
      case 'alert':
        return { icon: AlertTriangle, color: 'text-status-critical', bg: 'bg-status-critical/10' };
      default:
        return { icon: Lightbulb, color: 'text-kokoro-accent', bg: 'bg-kokoro-accent/10' };
    }
  };

  const { icon: Icon, color, bg } = getTypeConfig(type);

  return (
    <div className={clsx('p-3 rounded-lg border border-kokoro-border', bg)}>
      <div className="flex items-start gap-3">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={clsx('w-4 h-4', color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <p className="text-xs text-kokoro-muted mt-1">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-kokoro-border rounded-full overflow-hidden">
              <div
                className={clsx('h-full', color.replace('text-', 'bg-'))}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-xs text-kokoro-muted">{confidence}%</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAccept}
              className="flex-1 px-3 py-1.5 bg-kokoro-accent text-kokoro-dark text-xs font-medium rounded-lg hover:bg-opacity-90 transition-colors"
            >
              適用
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-kokoro-border text-kokoro-muted text-xs rounded-lg hover:text-white transition-colors"
            >
              無視
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Message Component
// ============================================
const Message: React.FC<{
  role: 'user' | 'assistant' | 'system';
  content: string;
}> = ({ role, content }) => (
  <div
    className={clsx(
      'flex gap-3 p-3',
      role === 'user' ? 'flex-row-reverse' : 'flex-row'
    )}
  >
    <div
      className={clsx(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        role === 'user' ? 'bg-kokoro-info/20' : 'bg-kokoro-accent/20'
      )}
    >
      {role === 'assistant' ? (
        <Bot className="w-4 h-4 text-kokoro-accent" />
      ) : (
        <span className="text-xs font-bold text-kokoro-info">U</span>
      )}
    </div>
    <div
      className={clsx(
        'max-w-[80%] px-3 py-2 rounded-lg text-sm',
        role === 'user'
          ? 'bg-kokoro-info/20 text-white'
          : 'bg-kokoro-darker text-kokoro-muted'
      )}
    >
      {content}
    </div>
  </div>
);

// ============================================
// Main AI Copilot Component
// ============================================
const AICopilot: React.FC = () => {
  const { isOpen, toggleCopilot, messages, addMessage, isProcessing, setProcessing } = useAICopilotStore();
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Demo suggestions
  const demoSuggestions = [
    {
      id: '1',
      type: 'resource_allocation',
      title: '医療物資の再配分を推奨',
      description: '新宿避難所への医療キット追加配送により、対応効率が23%向上する可能性があります。',
      confidence: 87,
    },
    {
      id: '2',
      type: 'alert',
      title: '渋谷区の火災対応に追加リソースが必要',
      description: '現場の状況から、消防車1台の追加派遣を推奨します。',
      confidence: 92,
    },
  ];

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    addMessage({ role: 'user', content: userMessage });
    setProcessing(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: generateDemoResponse(userMessage),
      });
      setProcessing(false);
    }, 1500);
  };

  const generateDemoResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('火災') || lowerQuery.includes('渋谷')) {
      return '渋谷区の火災について分析しました。現在、消防第3分隊が対応中です。延焼リスクを考慮すると、追加で消防車1台の派遣を推奨します。また、周辺住民約150名の避難誘導が必要な可能性があります。';
    }
    if (lowerQuery.includes('避難') || lowerQuery.includes('物資')) {
      return '現在、新宿避難所に320名が収容されています。食料は2日分、毛布は80%の充足率です。医療キットの追加配送を本日15:00に手配することを推奨します。';
    }
    if (lowerQuery.includes('状況') || lowerQuery.includes('サマリー')) {
      return '現在のオペレーション状況: アクティブインシデント12件（うち緊急3件）、派遣中リソース45件、活動中人員128名。最も優先度が高いのは渋谷区の火災対応です。';
    }
    
    return 'ご質問を承りました。現在のデータを分析中です。具体的なインシデント番号や地域名を指定いただくと、より詳細な情報をお伝えできます。';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'fixed z-50 bg-kokoro-panel border border-kokoro-border rounded-lg shadow-2xl flex flex-col',
        isExpanded
          ? 'inset-4'
          : 'bottom-4 right-4 w-96 h-[600px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kokoro-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-kokoro-accent/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-kokoro-accent" />
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-white">AI Copilot</h3>
            <p className="text-[10px] text-kokoro-muted">
              <Sparkles className="w-3 h-3 inline mr-1" />
              GPT-4 / Claude 対応準備中
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon text-kokoro-muted hover:text-white p-1"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleCopilot}
            className="btn-icon text-kokoro-muted hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {demoSuggestions.length > 0 && (
        <div className="px-4 py-3 border-b border-kokoro-border space-y-2 shrink-0">
          <h4 className="text-xs font-semibold text-kokoro-muted flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            AI 提案
          </h4>
          {demoSuggestions.slice(0, 2).map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              {...suggestion}
              onAccept={() => console.log('Accepted:', suggestion.id)}
              onDismiss={() => console.log('Dismissed:', suggestion.id)}
            />
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Bot className="w-12 h-12 text-kokoro-accent/50 mb-4" />
            <h4 className="text-sm font-medium text-white mb-2">
              AI アシスタントへようこそ
            </h4>
            <p className="text-xs text-kokoro-muted mb-4">
              インシデント分析、リソース最適化、状況サマリーなどをサポートします。
            </p>
            <div className="space-y-2">
              {['現在の状況をサマリーして', '渋谷区の火災について教えて', '物資の配分を最適化して'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); handleSend(); }}
                  className="block w-full px-3 py-2 text-xs text-left text-kokoro-muted hover:text-white bg-kokoro-darker hover:bg-kokoro-border rounded-lg transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <Message key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {isProcessing && (
              <div className="flex gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-kokoro-accent/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-kokoro-accent animate-spin" />
                </div>
                <div className="bg-kokoro-darker px-3 py-2 rounded-lg">
                  <span className="text-sm text-kokoro-muted">分析中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-kokoro-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="質問を入力..."
            className="input flex-1"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="btn btn-primary px-3"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-kokoro-muted mt-2 text-center">
          💡 ヒント: 具体的な地名やインシデント番号を含めると精度が向上します
        </p>
      </div>
    </div>
  );
};

export default AICopilot;
