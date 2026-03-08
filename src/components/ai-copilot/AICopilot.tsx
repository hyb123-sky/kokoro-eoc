// ============================================
// KOKORO EOC - AI Copilot Component
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useAICopilotStore } from '../../stores';
import clsx from 'clsx';

// ============================================
// Message Component
// ============================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : '')}>
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-kokoro-accent' : 'bg-kokoro-info'
        )}
      >
        {isUser ? (
          <span className="text-kokoro-dark text-sm font-bold">U</span>
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={clsx(
          'max-w-[80%] px-4 py-2 rounded-lg',
          isUser
            ? 'bg-kokoro-accent text-kokoro-dark'
            : 'bg-kokoro-darker border border-kokoro-border text-white'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-[10px] opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

// ============================================
// Main AI Copilot Component
// ============================================
const AICopilot: React.FC = () => {
  const {
    isOpen,
    messages,
    isLoading,
    isProcessing,
    toggleCopilot,
    addMessage,
    setLoading,
    setProcessing,
    clearMessages,
  } = useAICopilotStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);
    setProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `了解しました。「${userMessage}」についてお手伝いします。\n\n現在、この機能は開発中です。近日中にAI支援機能が利用可能になります。`,
      });
      setLoading(false);
      setProcessing(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleCopilot}
        className="fixed bottom-6 right-6 w-14 h-14 bg-kokoro-accent rounded-full shadow-lg flex items-center justify-center hover:bg-kokoro-accent/80 transition-all z-50"
      >
        <Sparkles className="w-6 h-6 text-kokoro-dark" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-kokoro-panel border border-kokoro-border rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kokoro-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-kokoro-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-kokoro-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">KOKORO AI</h3>
            <p className="text-xs text-kokoro-muted">緊急対応アシスタント</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearMessages}
            className="p-1.5 text-kokoro-muted hover:text-white rounded"
            title="履歴をクリア"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleCopilot}
            className="p-1.5 text-kokoro-muted hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-kokoro-muted">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm text-center">
              こんにちは！緊急対応についてお手伝いします。
            </p>
            <p className="text-xs text-center mt-2">
              インシデント対応、リソース配分、避難所状況などについてお聞きください。
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {(isLoading || isProcessing) && (
              <div className="flex items-center gap-2 text-kokoro-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">考え中...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-kokoro-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white placeholder-kokoro-muted focus:outline-none focus:border-kokoro-accent"
            disabled={isLoading || isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isProcessing}
            className="p-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;
