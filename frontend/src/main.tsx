import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.js';
import './styles.css';
import './styles/global.css';
import ThemeInit from './components/ThemeInit.js';
import UiInit from './components/UiInit.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2-minute stale time — reduces redundant refetches while keeping data fresh.
      staleTime: 2 * 60_000,
      // Don't refetch just because the user switched tabs — this was flooding the
      // rate limiter. Explicit invalidation (after mutations) keeps data current.
      refetchOnWindowFocus: false,
      // One retry on failure, then surface the error.
      retry: 1,
      // Keep unused cache entries for 5 minutes before GC.
      gcTime: 5 * 60_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <ThemeInit />
        <UiInit />
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
