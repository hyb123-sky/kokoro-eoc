// ============================================
// KOKORO EOC - App Entry Point
// ============================================

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppRouter from './app/Router';
import './styles/globals.css';
import './styles/map-popup.css';

// ============================================
// Query Client Configuration
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
});

// ============================================
// Check if development mode
// ============================================
const isDev = import.meta.env.DEV;

// ============================================
// Root App Component
// ============================================
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      {isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
