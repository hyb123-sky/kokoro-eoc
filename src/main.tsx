// ============================================
// KOKORO EOC - Application Entry Point
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './styles/globals.css';

// ============================================
// React Query Client 配置
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 默认缓存 5 分钟
      staleTime: 1000 * 60 * 5,
      // 缓存 30 分钟后删除
      gcTime: 1000 * 60 * 30,
      // 重试配置
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口聚焦时重新获取
      refetchOnWindowFocus: true,
      // 网络重连时重新获取
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================
// Check if development mode
// ============================================
const isDev = import.meta.env.DEV;

// ============================================
// Render Application
// ============================================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* 开发环境显示 DevTools */}
      {isDev && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  </React.StrictMode>
);
